# Validate every text-to-practice artefact against engine/schema (jsonschema, draft 2020-12). Exit 1 on any error.
# usage: python3 tools/validate-schemas.py
import json, glob, os, sys
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
E = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = {os.path.basename(f): json.load(open(f)) for f in glob.glob(f'{E}/schema/*.json')}
reg = Registry().with_resources([(s['$id'], Resource.from_contents(s)) for s in S.values()])
def v(schema, f, sub=None):
    sch = S[schema] if not sub else {**S[schema], '$ref': f"#/$defs/{sub}", 'oneOf': None}
    if sub: sch = {k: x for k, x in sch.items() if x is not None}
    errs = list(Draft202012Validator(sch, registry=reg).iter_errors(json.load(open(f))))
    print(('ok  ' if not errs else 'FAIL'), schema + (f'#{sub}' if sub else ''), os.path.relpath(f, E), *(f"\n     {'/'.join(map(str, e.path))}: {e.message[:160]}" for e in errs[:5]))
    return len(errs)
n = 0
for d in glob.glob(f'{E}/sources/*/source-text.json'): n += v('source-text.json', d)
for d in glob.glob(f'{E}/sources/books/*/'):   # whole books (passes 0-2; text kept in the private data repo)
    n += v('source-text.json', d + 'source-text.json')
    for f in ('sections.json', 'map.json', 'rules.json'):
        if os.path.exists(d + f): n += v('book-source.json', d + f)
for d in glob.glob(f'{E}/pipeline/*/'):
    n += v('passages.json', d + 'passages.json'); n += v('instruction.json', d + 'instructions.json'); n += v('instruction.json', d + 'instructions.draft.json')
    n += v('narration-script.json', d + 'narration.json')
    if os.path.exists(d + 'ask.json'): n += v('ask-preload.json', d + 'ask.json')
    n += v('timeline.json', d + 'timeline.json')
for f in glob.glob(f'{E}/renders/*/voice/manifest.json'): n += v('render.json', f, 'voice_manifest')
for f in glob.glob(f'{E}/renders/*/cues/cues.json'): n += v('render.json', f, 'cue_kit')
for f in glob.glob(f'{E}/renders/*/mix/*.json'): n += v('render.json', f, 'mix')
n += v('inference-rules.json', f'{E}/tools/extract/defaults.json')
# practice v2 (practice.json v1 lives in ../specs/schema; resolve it by file if present)
v1 = os.path.join(E, '..', 'specs', 'schema', 'practice.json')
if os.path.exists(v1):
    for extra in ('practice.json', 'common.json'):
        p = os.path.join(E, '..', 'specs', 'schema', extra)
        if os.path.exists(p): s = json.load(open(p)); reg = reg.with_resource(s.get('$id', extra), Resource.from_contents(s)); reg = reg.with_resource('https://tantrafiles.xyz/schema/' + extra, Resource.from_contents(s))
for f in sorted(glob.glob(f'{E}/practices/*.json')): n += v('practice-v2.json', f)
for f in sorted(glob.glob(f'{E}/routines/*.json')): n += v('routine.json', f)
print('schema errors:', n); sys.exit(1 if n else 0)
