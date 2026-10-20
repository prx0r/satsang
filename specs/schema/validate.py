#!/usr/bin/env python3
"""Validates the normalised entities in ../../mcp/data/wiser.json against specs/schema/*.json.
Usage: python3 validate.py [path/to/wiser.json]   (needs `pip install jsonschema`)"""
import json, os, sys, collections
from jsonschema import Draft202012Validator
from referencing import Registry, Resource

HERE = os.path.dirname(os.path.abspath(__file__))
data_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "../../mcp/data/wiser.json")
schemas = {}
for f in os.listdir(HERE):
    if f.endswith(".json"):
        schemas[f[:-5]] = json.load(open(os.path.join(HERE, f)))
reg = Registry().with_resources([(s["$id"], Resource.from_contents(s)) for s in schemas.values()])
data = json.load(open(data_path))
bad = collections.Counter(); total = 0; examples = {}
for kind in ["person", "tradition", "clip", "text", "practice", "topic", "collection", "place", "edge"]:
    v = Draft202012Validator(schemas[kind], registry=reg)
    for rid, rec in data.get(kind, {}).items():
        total += 1
        errs = list(v.iter_errors(rec))
        if errs:
            bad[kind] += 1
            examples.setdefault(kind, (rid, errs[0].json_path, errs[0].message[:160]))
print(f"validated {total} records; failing: {dict(bad) or 'none'}")
for k, e in examples.items():
    print(" ", k, e)
sys.exit(1 if bad else 0)
