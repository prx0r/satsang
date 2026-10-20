#!/usr/bin/env python3
"""Build a lineage cluster for a tradition subtree.

Usage:
    python3 cluster.py --repo /path/to/satsang --root kashmir-shaivism [--root trika...]
                       --id trika --title 'Trika (Kashmir Shaivism)' --out clusters/trika.json

A cluster = members + dharma chains + academic chains + texts + practices +
places + orphans + inception trace (walk to oldest ancestor + atlas pre-root
links where the merged graph reaches further back). Never writes to the repo.
"""
import argparse
import json
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--root", action="append", default=[])
    ap.add_argument("--id", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    R = Path(a.repo)
    w = json.load(open(R / "app/site/data/wisegraph/wise.json"))
    TR, PP = w["traditions"], w["people"]
    e = json.load(open(R / "app/wisegraph/edges.json"))
    edges = e.get("edges", e if isinstance(e, list) else [])
    try:
        mrg = json.load(open(R / "atlas/merged/nodes.json"))["nodes"]
        me = json.load(open(R / "atlas/merged/edges.json"))["edges"]
    except Exception:
        mrg, me = [], []

    def sub(t):
        out = {t}
        for k, v in TR.items():
            if v.get("parent") == t:
                out |= sub(k)
        return out
    S = set()
    for r in a.root:
        S |= sub(r)

    members = {k: v for k, v in PP.items() if v.get("t") in S}
    rel = ("teacher_of", "dharma_heir_of", "studied_with", "ordained_by")
    dharma = [x for x in edges if x.get("type") in rel
              and (x.get("from") in members or x.get("to") in members)]
    acad = [x for x in edges if x.get("type") in ("academic_supervisor_of", "translated")
            and (x.get("from") in members or x.get("to") in members)]
    texts = {k: v for k, v in PP.items() if v.get("k") == "text" and v.get("t") in S}
    for x in acad:
        if x.get("type") == "translated" and x.get("to") not in texts and x["to"] in PP:
            texts[x["to"]] = PP[x["to"]]
    pract = []
    import glob
    for f in glob.glob(str(R / "sources/*/practices.json")):
        d = json.load(open(f))
        L = d if isinstance(d, list) else d.get("practices", [])
        for p in L:
            if isinstance(p, dict) and p.get("school") in S and p.get("id"):
                pract.append(p["id"])
    pl = json.load(open(R / "sources/places-uk/places.json"))["places"]
    places = [x["id"] for x in pl if set(x.get("traditions", [])) & S]
    linked = set()
    for x in dharma + acad:
        linked.add(x.get("from"))
        linked.add(x.get("to"))
    orphans = sorted(k for k in members if k not in linked)
    # inception: oldest ancestors (no incoming dharma edge within cluster)
    has_teacher = {x["to"] for x in dharma if x.get("to") in members}
    roots = sorted(k for k in members if k not in has_teacher)
    # atlas reach-back: merged edges touching cluster members from outside
    reach = [x for x in me if (x.get("to") in members or x.get("to") in texts)
             and x.get("from") not in members]
    living = sorted(k for k, v in members.items() if v.get("living") is True)
    scholars = sorted(k for k, v in members.items()
                      if "scholar" in (v.get("bio", "")[:0] or "") or k in {
                          x.get("from") for x in acad} | {x.get("to") for x in acad})
    out = {"id": a.id, "title": a.title, "roots": a.root, "subtree": sorted(S),
           "counts": {"members": len(members), "dharma_edges": len(dharma),
                      "academic_edges": len(acad), "texts": len(texts),
                      "practices": len(pract), "places": len(places),
                      "living": len(living), "orphans": len(orphans)},
           "living": living, "roots_oldest": roots, "orphans": orphans,
           "texts": sorted(texts), "practices": sorted(set(pract)), "places": places,
           "dharma": [{"from": x.get("from"), "type": x.get("type"), "to": x.get("to")}
                      for x in dharma],
           "academic": [{"from": x.get("from"), "type": x.get("type"), "to": x.get("to")}
                        for x in acad],
           "atlas_reachback": [{"from": x.get("from"), "type": x.get("type"), "to": x.get("to")}
                               for x in reach][:20]}
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    json.dump(out, open(a.out, "w"), ensure_ascii=False, indent=1)
    print(f"{a.id}: {len(members)} members, {len(dharma)} dharma, {len(acad)} acad, "
          f"{len(texts)} texts, {len(pract)} pract, {len(places)} places, "
          f"{len(living)} living, {len(orphans)} orphans, {len(reach)} reachback")


if __name__ == "__main__":
    main()
