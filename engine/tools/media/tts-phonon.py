#!/usr/bin/env python3
# Stage 7a (on-device) · pre-render a practice's narration with Phonon TTS (pip install ptts; github.com/gradium-ai/xn-ptts).
# Every spoken line of a practice (segment `say`, else block `say`/`caption`) becomes one static mp3 + a manifest
# (schema/render.json#/$defs/voice_manifest) with measured dur_s and a 25 fps loudness envelope (`env`, 0-1) that the
# player's sound wave answers. Cached by sha1(model|voice|pace|seed|spoken). Swap the voice with --voice / --model:
# the player only reads the manifest, so any TTS that writes the same manifest is a drop-in.
#
# usage: python3 tools/media/tts-phonon.py practices/<id>.json [--voice Everly] [--model hf://gradium/phonon-31m-en] [--pace 0.45] [--seed 7]
# then (optional, word timestamps + intelligibility): /workspace/pyenv/bin/python tools/media/align.py renders/<id>/voice/manifest.json
#
# Licences: code MIT OR Apache-2.0; Phonon 31m English weights Apache-2.0 (huggingface.co/gradium/phonon-31m-en);
# catalog voices Apache-2.0 (huggingface.co/gradium/phonon-voices). Phonon 40m models are CC BY-NC 4.0 (gated; acceptable here
# because Satsang is non-commercial, but not used by default). The voices are generic catalog voices, never a teacher's voice.
import sys, os, json, re, hashlib, subprocess, argparse, datetime
import numpy as np

ENGINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ap = argparse.ArgumentParser()
ap.add_argument('practice')
ap.add_argument('--voice', default='Everly')
ap.add_argument('--model', default='hf://gradium/phonon-31m-en')
ap.add_argument('--pace', type=float, default=0.45, help='duration_delta condition: > 0 speaks slower')
ap.add_argument('--seed', type=int, default=7)
ap.add_argument('--gap', type=float, default=0.55, help='silence between sentences, s')
ap.add_argument('--force', action='store_true')
a = ap.parse_args()

P = json.load(open(a.practice)); pid = P['id']
out = os.path.join(ENGINE, 'renders', pid, 'voice'); wavd = os.path.join(out, 'wav'); os.makedirs(wavd, exist_ok=True)
MODEL_LABEL = a.model.replace('hf://', '')

def spoken(s):  # captions keep typography; speech drops quote marks, ellipses become a comma
    s = re.sub(r'[“”"]', '', s); s = re.sub(r'\s*…\s*', ', ', s)
    return re.sub(r',\s*\.', '.', s).strip()

def lines_of(p):
    sc = p['script']; L = []
    def walk(bs):
        for b in bs or []:
            if b.get('blocks'): walk(b['blocks']); continue
            say = b.get('say') if isinstance(b.get('say'), str) else (b.get('caption') if b.get('say') is not False else None)
            if b.get('kind') == 'segment': say = b.get('say') or None
            if say: L.append((b.get('id') or f'L{len(L)+1:02d}', b.get('caption') or say, spoken(b.get('say_spoken') or say)))
    for part in ('intro', 'round', 'between', 'outro'): walk(sc.get(part))
    seen, U = set(), []
    for x in L:
        if x[2] in seen: continue
        seen.add(x[2]); U.append(x)
    return U

def key(t): return hashlib.sha1(f'phonon|{MODEL_LABEL}|{a.voice}|{a.pace}|{a.seed}|{t}'.encode()).hexdigest()[:16]
def sh(*c): return subprocess.run(c, check=True, capture_output=True, text=True).stdout

tts = None
def synth(text):
    global tts
    import ptts
    if tts is None:
        tts = ptts.TTS(a.model, lang='en') if a.model != 'hf://gradium/phonon-31m-en' else ptts.TTS(lang='en')
        tts.set_conditions({'duration_delta': a.pace})
    sr = tts.sample_rate
    parts = [s for s in re.split(r'(?<=[.?!])\s+', text) if s.strip()]
    gap = np.zeros(int(a.gap * sr), dtype=np.float32); chunks = []
    for i, s in enumerate(parts):
        chunks.append(np.asarray(tts.synth(s, voice=a.voice, seed=a.seed + i), dtype=np.float32))
        if i < len(parts) - 1: chunks.append(gap)
    return np.concatenate(chunks), sr

def write_wav(f, x, sr):
    import wave
    x = np.clip(x, -1, 1); pcm = (x * 32767).astype('<i2')
    with wave.open(f, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())

def envelope(f, fps=25):
    import wave
    with wave.open(f) as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
    hop = sr // fps; n = max(1, len(x) // hop)
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    db = 20 * np.log10(rms + 1e-9); e = np.clip((db + 48) / 36, 0, 1)   # -48 dB → 0, -12 dB → 1
    return [round(float(v), 2) for v in e]

lines = []
for lid, text, sp in lines_of(P):
    k = key(sp); raw = os.path.join(wavd, k + '.wav'); trim = os.path.join(wavd, k + '.trim.wav'); mp3 = os.path.join(out, k + '.mp3')
    via = 'cache'
    if a.force or not os.path.exists(raw):
        x, sr = synth(sp); write_wav(raw, x, sr); via = 'phonon'
    if a.force or not os.path.exists(trim):
        sh('ffmpeg', '-v', 'error', '-y', '-i', raw, '-af',
           'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12,areverse,'
           'loudnorm=I=-18:TP=-2:LRA=7', '-ac', '1', '-ar', '24000', trim)
    if a.force or not os.path.exists(mp3):
        sh('ffmpeg', '-v', 'error', '-y', '-i', trim, '-ac', '1', '-ar', '24000', '-b:a', '48k', mp3)
    dur = float(sh('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', trim).strip())
    lines.append({'id': lid, 'text': text, 'spoken': sp, 'key': k, 'file': f'renders/{pid}/voice/{k}.mp3', 'dur_s': round(dur, 3), 'via': via,
                  'env_fps': 25, 'env': envelope(trim)})
    print(lid, via, f'{dur:.2f}s', sp)

prev = {}
mf = os.path.join(out, 'manifest.json')
if os.path.exists(mf):
    for l in json.load(open(mf)).get('lines', []): prev[l['key']] = l
for l in lines:  # keep alignment results from align.py when the clip did not change
    for f in ('words', 'heard', 'match', 'align_key'):
        if f in prev.get(l['key'], {}): l[f] = prev[l['key']][f]
man = {'type': 'voice_manifest', 'practice': pid,
       'voice': {'provider': 'phonon', 'model': MODEL_LABEL, 'id': a.voice, 'title': f'{a.voice} (Phonon voice catalog)',
                 'speed': a.pace, 'seed': a.seed,
                 'licence': 'model Apache-2.0 (gradium/phonon-31m-en); voice Apache-2.0 (gradium/phonon-voices); runtime MIT OR Apache-2.0 (gradium-ai/xn-ptts)',
                 'policy': 'generic catalog voice, not named after or cloned from any teacher; chosen by the agent, swappable (re-run with --voice)'},
       'created': datetime.date.today().isoformat(), 'lines': lines}
json.dump(man, open(mf, 'w'), indent=1, ensure_ascii=False)
print('manifest', mf, len(lines), 'lines', round(sum(l['dur_s'] for l in lines), 1), 's')
