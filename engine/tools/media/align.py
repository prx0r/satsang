# Stage 7b · word timestamps + intelligibility gate for the narration clips (faster-whisper base.en, CPU int8).
# usage: /workspace/pyenv/bin/python tools/media/align.py renders/<id>/voice/manifest.json
# Writes words[] (onset/offset, s, relative to the trimmed clip) and match (share of script words heard) into the manifest.
import json, sys, os, re, subprocess, difflib, time
T0 = time.time(); BUDGET = float(os.environ.get('ALIGN_BUDGET_S', '90'))  # stop and save before the sandbox's 120 s limit; rerun to resume
import numpy as np
from faster_whisper import WhisperModel
man_f = sys.argv[1]; man = json.load(open(man_f)); vdir = os.path.dirname(man_f)
m = WhisperModel('base.en', device='cpu', compute_type='int8')
norm = lambda s: re.findall(r"[a-z']+", s.lower().replace('’', "'"))
bad = []
for ln in man['lines']:
    if ln.get('words') is not None and ln.get('align_key') == ln['key']: continue
    if time.time() - T0 > BUDGET: print('budget reached; rerun to resume'); break
    wav = os.path.join(vdir, 'wav', ln['key'] + '.trim.wav')
    a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', wav, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(a, word_timestamps=True, language='en', initial_prompt='buddho, bud, dho, dhammo, sangho')
    ws = [w for s in segs for w in s.words]
    heard = [re.sub(r"[^a-z']", '', w.word.lower()) for w in ws]
    want = norm(ln['spoken'])
    sm = difflib.SequenceMatcher(a=want, b=heard, autojunk=False)
    match = sum(b.size for b in sm.get_matching_blocks()) / max(1, len(want))
    ln['words'] = [{'w': w.word.strip(), 't0': round(w.start, 3), 't1': round(w.end, 3)} for w in ws]
    ln['heard'] = ' '.join(w.word.strip() for w in ws); ln['match'] = round(match, 3); ln['align_key'] = ln['key']
    json.dump(man, open(man_f, 'w'), ensure_ascii=False, indent=1)  # save per line: resumable under the 120 s tool limit
    if match < 0.8: bad.append(f"{ln['id']} {match:.2f}: '{ln['spoken']}' heard '{ln['heard']}'")
json.dump(man, open(man_f, 'w'), ensure_ascii=False, indent=1)
print(f"aligned {len(man['lines'])} lines; mean match {np.mean([l.get('match', 0) for l in man['lines']]):.3f}")
bad = [f"{l['id']} {l['match']:.2f}: '{l['spoken']}' heard '{l['heard']}'" for l in man['lines'] if l.get('match') is not None and l['match'] < 0.8]
for b in bad: print('LOW', b)
