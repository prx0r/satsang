# Stage 7d · session mix from the compiled timeline (the one clock): narration clips on voice events, kit cues on audio events,
# two-pass loudnorm to -14 LUFS integrated / -1.5 dBTP, then measured again from the encoded file.
# usage: /workspace/pyenv/bin/python tools/media/mix.py <timeline.json> <renders/<id>> [--from S --to S --out name]
import sys, os, json, subprocess, wave, re
import numpy as np
SR = 44100
tl = json.load(open(sys.argv[1])); rd = sys.argv[2]
args = sys.argv[3:]; opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
man = json.load(open(os.path.join(rd, 'voice', 'manifest.json'))); kit = json.load(open(os.path.join(rd, 'cues', 'cues.json')))
by_text = {l['text']: l for l in man['lines']}
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
VO_LEAD = 0.15                # voice starts just after the phase it names
CUE_GAIN = {'bowl-start': 0.08, 'bell-end': 0.075, 'chime': 0.066, 'bell-soft': 0.066, 'tick': 0.05, 'warn': 0.2}  # measured: bowls ≈ -18 dB, chime ≈ -20 dB re voice loudness (PRACTICE-MEDIA: 18-24 dB under)
t0 = float(opt('--from', 0)); t1 = float(opt('--to', tl['total_s'] + 11)); n = int((t1 - t0) * SR) + 1
vo = np.zeros(n, np.float32); fx = np.zeros(n, np.float32); placed = []
def put(buf, x, t, g=1.0):
    i = int(round((t - t0) * SR)); j0 = max(0, -i); i = max(0, i); m = min(len(x) - j0, n - i)
    if m > 0: buf[i:i + m] += g * x[j0:j0 + m]
for v in tl['tracks']['voice']:
    if not v.get('say'): continue
    l = by_text.get(v['text'])
    if not l: print('no clip for', v['text'][:40]); continue
    x = load(os.path.join(rd, 'voice', 'wav', l['key'] + '.trim.wav'))
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 10 ** (-20 / 20)   # VO at -20 dBFS RMS (gseries2 convention)
    put(vo, x, v['t'] + VO_LEAD)
    if t0 <= v['t'] < t1: placed.append({'line': l['id'], 't': round(v['t'] + VO_LEAD, 3), 'dur_s': l['dur_s']})
for a in tl['tracks']['audio']:
    c = kit['cues'].get(a['sound']) or (kit['cues'].get('chime') if a['sound'] == 'bell-soft' else None)
    if not c: continue
    put(fx, load(os.path.join(rd, 'cues', c['wav'])), a['t'], CUE_GAIN.get(a['sound'], 0.15))
# duck cues 6 dB under speech
def mavg(x, w):  # moving average via cumulative sum (np.convolve is far too slow on a 40 M-sample session)
    c = np.cumsum(np.concatenate([[0], x])); h = w // 2; i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i + h, 0, len(x))
    return ((c[hi] - c[lo]) / np.maximum(1, hi - lo)).astype(np.float32)
env = mavg(np.abs(vo).astype(np.float64), int(0.05 * SR)); duck = np.where(env > 0.01, 0.5, 1.0)
duck = mavg(duck, int(0.2 * SR))
y = vo + fx * duck
name = opt('--out', 'session'); out = os.path.join(rd, 'mix'); os.makedirs(out, exist_ok=True)
pre = os.path.join(out, name + '.pre.wav')
with wave.open(pre, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
# two-pass loudnorm
m1 = subprocess.run(['ffmpeg', '-hide_banner', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(re.findall(r'\{[^{}]*\}', m1)[-1])
af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
final = os.path.join(out, name + '.m4a')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', af, '-ar', '48000', '-ac', '2', '-c:a', 'aac', '-b:a', '128k', final], check=True)
m2 = subprocess.run(['ffmpeg', '-hide_banner', '-i', final, '-af', 'loudnorm=I=-14:TP=-1.5:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
k = json.loads(re.findall(r'\{[^{}]*\}', m2)[-1])
rep = {'file': os.path.relpath(final, rd), 'from_s': t0, 'to_s': t1, 'integrated_lufs': float(k['input_i']), 'true_peak_dbtp': float(k['input_tp']), 'lra': float(k['input_lra']), 'target': '-14 LUFS / -1.5 dBTP', 'lines_placed': len(placed), 'vo_lead_s': VO_LEAD, 'cue_gain': CUE_GAIN, 'duck_db': 6}
json.dump({**rep, 'placed': placed}, open(os.path.join(out, name + '.json'), 'w'), indent=1)
os.remove(pre)
print(json.dumps(rep))
