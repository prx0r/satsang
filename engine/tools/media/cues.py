# Stage 7c · the practice sound kit (PRACTICE-MEDIA §1), generated only: no samples, no licences needed.
# Singing bowl = modal synthesis (inharmonic partials 1 : 2.76 : 5.40 : 8.93, each a slowly beating detuned pair, mallet transient).
# Chime / tick come from the earshot bank (pluck/kalimba_soft, fit/land.light/finger_wood) when earshot is importable, else synthesised.
# usage: /workspace/pyenv/bin/python tools/media/cues.py <out dir>   → <id>.wav (48 kHz mono) + <id>.mp3 + cues.json
import sys, os, json, subprocess, numpy as np
SR = 48000
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)
def bowl(f0=196.0, dur=9.0, strikes=(0.0,), gain=0.9):
    t = np.arange(int(SR * dur)) / SR; y = np.zeros_like(t)
    for s0 in strikes:
        tt = np.clip(t - s0, 0, None); on = (t >= s0)
        for ratio, amp, t60 in ((1.0, 1.0, 9.0), (2.76, 0.45, 5.5), (5.40, 0.18, 2.8), (8.93, 0.07, 1.4)):
            f = f0 * ratio; beat = 0.6 + 0.9 * ratio / 9
            env = np.exp(-6.91 * tt / t60) * (1 - np.exp(-tt / 0.004))
            y += on * amp * env * (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * (f + beat) * tt + 1.3))
        n = (rng.standard_normal(len(t)) * np.exp(-np.clip(t - s0, 0, None) / 0.006)) * (t >= s0)  # mallet
        y += 0.25 * np.convolve(n, np.ones(6) / 6, 'same')
    y *= np.minimum(1, (dur - t) / 0.4)  # fade the tail end
    return gain * y / np.max(np.abs(y))
def tone_pair(dur=1.4):  # the safety two-tone, used nowhere else (PRACTICE-MEDIA)
    t = np.arange(int(SR * dur)) / SR; y = np.zeros_like(t)
    for k, f in enumerate((660.0, 440.0)):
        s = k * 0.42; tt = np.clip(t - s, 0, None); env = (t >= s) * np.minimum(1, tt / 0.01) * np.exp(-tt / 0.18)
        y += env * np.sin(2 * np.pi * f * tt)
    y *= np.minimum(1, (dur - t) / 0.3)
    return 0.7 * y / np.max(np.abs(y))
def chime_synth(f=1318.5, dur=2.4):
    t = np.arange(int(SR * dur)) / SR; y = sum(a * np.exp(-t / d) * np.sin(2 * np.pi * f * r * t) for r, a, d in ((1, 1, .9), (2.0, .25, .4), (3.01, .1, .2)))
    return 0.6 * y * np.minimum(1, t / 0.003) / np.max(np.abs(y))
def wav(name, y):
    import wave
    p = os.path.join(out, name + '.wav'); a = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(a.tobytes())
    return p
made = {}
made['bowl-start'] = wav('bowl-start', bowl(196.0, 9.0)), 'session start: one bowl strike, long tail'
made['bell-end'] = wav('bell-end', bowl(174.6, 11.0, strikes=(0.0, 2.6))), 'session end: two strikes'
made['warn'] = wav('warn', tone_pair()), 'safety stop two-tone (Ask layer; never used elsewhere)'
ES = '/workspace/projects/b9c6beb2-e600-470e-aaca-3d516d61b9c2/gcomedy/essay1/tools/earshot'
via = 'synth'
try:
    env = dict(os.environ, PYTHONPATH=ES)
    for cid, bank, args in (('chime', 'pluck/kalimba_soft', ['--pitch', 'E6']), ('tick', 'fit/land.light/finger_wood', [])):
        p = os.path.join(out, cid + '.raw.wav')
        subprocess.run([sys.executable, '-m', 'earshot', 'sfx', 'render', bank, '-o', p, *args], check=True, env=env, capture_output=True, timeout=90)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-ac', '1', '-ar', str(SR), os.path.join(out, cid + '.wav')], check=True); os.remove(p)
        made[cid] = os.path.join(out, cid + '.wav'), f'earshot {bank} {" ".join(args)}'.strip()
    via = 'earshot'
except Exception as e:
    print('earshot unavailable, synthesising chime/tick:', str(e)[:120])
    made['chime'] = wav('chime', chime_synth()), 'stage change: tiny chime (synth fallback)'
    t = np.arange(int(SR * .05)) / SR; made['tick'] = wav('tick', 0.5 * np.sin(2 * np.pi * 900 * t) * np.exp(-t / .008)), 'phase tick (synth fallback)'
meta = {}
for cid, (p, desc) in made.items():
    mp3 = p[:-4] + '.mp3'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-ac', '1', '-ar', '44100', '-b:a', '48k', mp3], check=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
    meta[cid] = {'file': os.path.basename(mp3), 'wav': os.path.basename(p), 'dur_s': round(dur, 3), 'bytes': os.path.getsize(mp3), 'desc': desc}
json.dump({'type': 'cue_kit', 'sr': SR, 'via': via, 'cues': meta}, open(os.path.join(out, 'cues.json'), 'w'), indent=1)
for k, v in meta.items(): print(k, v['dur_s'], v['bytes'], v['desc'])
