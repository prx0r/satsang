#!/usr/bin/env python3
"""Populate the Atlas with UK + network places, teachers and lineage links.

Usage:
    python3 populate_places.py --repo /path/to/satsang --ext /path/to/satsang-extensions
                               --out DIR

Reads canonical places + place edges + main-teacher links, emits
atlas-shaped nodes/edges (atlas.schema.json), a traceback report and a
backlog (missing lanes, missing persons, orphans). Never writes to the repo.

Lane assignment: exact (family, school) legacy match, else school match,
else family match + overrides, else null + backlog. Ambiguous multi-lane
schools (kashmir-shaivism) go null, never guessed.

Edge projection (atlas has no sister_of/teaches_at):
    teaches_at / teacher_at / abbot_of / associated_with -> located_at (note keeps v1 type)
    founded -> founded
    sister_of -> part_of (note keeps v1 sister_of branch-house meaning)
Only emitted when BOTH ends exist in (merged ∪ new) nodes.
"""
import argparse
import json
from pathlib import Path

OVERRIDES = {"modern-paganism": "pagan", "sufism": "sufi", "jewish": "kabbalah",
             "sikh": None, "triratna": None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--ext", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    R, E, O = Path(a.repo), Path(a.ext), Path(a.out)
    O.mkdir(parents=True, exist_ok=True)

    w = json.load(open(R / "app/site/data/wisegraph/wise.json"))
    TR, PP = w["traditions"], w["people"]
    merged_n = json.load(open(R / "atlas/merged/nodes.json"))["nodes"]
    have = {x["id"] for x in merged_n}
    atlas_persons = {x["id"] for x in merged_n if x.get("kind") in ("person", "scholar")}
    lanes = json.load(open(R / "atlas/merged/streams.json"))["lanes"]
    by_school, by_family = {}, {}
    for L in lanes:
        leg = L.get("legacy") or {}
        if leg.get("school"):
            by_school.setdefault(leg["school"], []).append(L["id"])
        if leg.get("family"):
            by_family.setdefault(leg["family"], []).append(L["id"])

    def lane_of(trad):
        if trad in OVERRIDES:
            return OVERRIDES[trad], ("override" if OVERRIDES[trad] else "gap")
        chain, t, seen = [], trad, 0
        while t and t in TR and seen < 8:
            chain.append(t)
            t = TR[t].get("parent")
            seen += 1
        fam = chain[-1] if chain else None
        for t in chain:
            Ls = by_school.get(t, [])
            if len(Ls) == 1:
                return Ls[0], "school"
            if len(Ls) > 1:
                return None, "ambiguous"
        if fam in OVERRIDES:
            return OVERRIDES[fam], ("override" if OVERRIDES[fam] else "gap")
        Ls = by_family.get(fam, [])
        if len(Ls) == 1:
            return Ls[0], "family"
        return None, "gap"

    places = []
    for pf in [R / "sources/places-uk/places.json",
               E / "08-places-networks/places-networks.json",
               E / "15-niche-hermitages/places-niche.json",
               E / "16-usa-places/places-usa.json",
               E / "17-south-america/sources/south-america/places-niche.json",
               E / "18-global-faiths/sources/global-faiths/places-global.json",
               E / "26-asia-europe/places-asia-europe.json",
               E / "27-teaching-hotspots/places-hotspots.json",
               E / "29-thai-depth/places-thai.json"]:
        if pf.exists():
            places += json.load(open(pf)).get("places", [])
    _place_ids = {p["id"] for p in places if isinstance(p, dict) and p.get("id")}
    pedges = []
    for f in list((R / "sources").glob("*/edges-additions.json")) + [
            E / "08-places-networks/edges-networks.json",
            E / "10-golden-path/edges-teacher-at.json",
            E / "15-niche-hermitages/edges-niche.json",
            E / "16-usa-places/edges-usa.json",
            E / "17-south-america/sources/south-america/edges-additions.json",
            E / "18-global-faiths/sources/global-faiths/edges-additions.json",
            E / "26-asia-europe/edges-asia.json",
            E / "27-teaching-hotspots/edges-hotspots.json",
            E / "29-thai-depth/edges-thai.json",
            E / "30-second-wave/sources/batch2-islamic/edges-additions.json"]:
        if f.exists():
            d = json.load(open(f))
            es = d if isinstance(d, list) else d.get("edges", [])
            pedges += [x for x in es
                       if isinstance(x, dict) and (
                           x.get("target_kind") == "place"
                           or x.get("to") in _place_ids or x.get("from") in _place_ids)]
    main_t = {}
    for mf in [E / "12-minimal-entries/main-teachers.json",
               E / "16-usa-places/main-teachers-usa.json",
               E / "26-asia-europe/main-teachers-asia.json",
               E / "27-teaching-hotspots/main-teachers-hotspots.json",
               E / "29-thai-depth/main-teachers-thai.json"]:
        if mf.exists():
            for L in json.load(open(mf)).get("links", []):
                if L.get("teacher"):
                    main_t[L["place"]] = L["teacher"]

    nodes, edges, backlog, trace = [], [], [], []
    eid = 0

    def edge(fr, to, ty, conf, note, url):
        nonlocal eid
        eid += 1
        edges.append({"id": f"wpl-{eid:04d}", "from": fr, "to": to, "type": ty,
                      "conf": conf if conf in ("high", "medium", "low") else "medium",
                      "basis": "historical",
                      "provenance": [{"cite": note[:120], "url": url or "",
                                      "check": "mentioned"}],
                      "note": note})

    for p in places:
        pid, slug = p["id"], "pl-" + p["id"]
        if slug in have:
            backlog.append({"id": f"atlas-{pid}-dup", "kind": "coverage-gap", "file": pid,
                            "reason": "place node id already in atlas; hand-merge", "severity": "backlog"})
            continue
        trad = (p.get("traditions") or [None])[0]
        lane, how = lane_of(trad) if trad else (None, "gap")
        fnd = p.get("founded")
        time = {"start": fnd, "end": fnd, "precision": "year", "basis": "historical",
                "confidence": "medium",
                "label": str(fnd)} if isinstance(fnd, int) else None
        node = {"id": slug, "kind": "place", "label": p["name"], "stream": lane,
                "streams": [lane] if lane else [], "time": time, "time_alt": [],
                "ids": ({"wikidata": p["wikidata"]} if str(p.get("wikidata", "")).startswith("Q") else {}),
                "tradition": trad,
                "legacy": {"table": "places", "id": pid},
                "note": p.get("description", "")}
        if isinstance(p.get("lat"), (int, float)) and isinstance(p.get("lng"), (int, float)):
            node["geo"] = {"lat": p["lat"], "lng": p["lng"],
                           "precision": p.get("coord_precision", "as recorded")}
        nodes.append(node)
        if lane is None:
            backlog.append({"id": f"atlas-{pid}-lane", "kind": "coverage-gap", "file": pid,
                            "reason": f"no lane for tradition {trad} ({how}); propose lane or map",
                            "severity": "backlog"})
        # teachers: main link + additions edges
        teachers = []
        if pid in main_t:
            teachers.append((main_t[pid], "main teacher", "high"))
        for x in pedges:
            if x.get("to") == pid and x.get("from") in PP:
                teachers.append((x["from"], f"v1 {x.get('type')}", x.get("conf", "medium")))
        seen_t = set()
        for tid, why, conf in teachers:
            if tid in seen_t:
                continue
            seen_t.add(tid)
            if tid not in atlas_persons:
                backlog.append({"id": f"atlas-{pid}-person", "kind": "coverage-gap", "file": pid,
                                "reason": f"teacher {tid} ({why}) not an atlas person node",
                                "severity": "backlog"})
                continue
            edge(tid, slug, "located_at", conf, f"{PP[tid].get('n', tid)} {why} at {p['name']}",
                 p.get("url", ""))
            if x_is_founded(pedges, tid, pid):
                edge(tid, slug, "founded", conf, f"{tid} founded {p['name']}", p.get("url", ""))
        # branch links
        for x in pedges:
            if x.get("type") == "sister_of" and x.get("to") == pid:
                sib = "pl-" + x["from"]
                if sib in have or any(n["id"] == sib for n in nodes):
                    edge(sib, slug, "part_of", x.get("conf", "medium"),
                         f"branch house of the same lineage (v1 sister_of {x['from']})",
                         p.get("url", ""))
        # traceback chain
        chain = [f"place:{pid}", f"lane:{lane or '?'}"]
        chain += [f"teacher:{t}" for t, _, _ in teachers[:4]]
        anc, t0, sn = [], trad, 0
        while t0 and t0 in TR and sn < 6:
            anc.append(t0)
            t0 = TR[t0].get("parent")
            sn += 1
        chain.append("lineage:" + ">".join(anc) if anc else "lineage:?")
        trace.append({"place": pid, "lane": lane, "lane_how": how, "chain": chain,
                      "teachers_in_atlas": sum(1 for t, _, _ in teachers if t in atlas_persons),
                      "teachers_total": len(seen_t)})

    json.dump({"_meta": {"source": "places-population 2026-10-20", "count": len(nodes)},
               "nodes": nodes}, open(O / "atlas-places.json", "w"), ensure_ascii=False, indent=1)
    json.dump({"_meta": {"source": "places-population 2026-10-20", "count": len(edges)},
               "edges": edges}, open(O / "atlas-place-edges.json", "w"), ensure_ascii=False, indent=1)
    json.dump(trace, open(O / "traceback.json", "w"), ensure_ascii=False, indent=1)
    json.dump({"type": "review-queue", "items": backlog}, open(O / "backlog.json", "w"),
              ensure_ascii=False, indent=1)
    nolane = sum(1 for n_ in nodes if not n_["stream"])
    noteach = sum(1 for t in trace if t["teachers_total"] == 0)
    print(f"{len(nodes)} place nodes ({nolane} laneless), {len(edges)} edges, "
          f"{noteach}/{len(trace)} places teacherless, {len(backlog)} backlog items")


def x_is_founded(pedges, tid, pid):
    return any(x.get("from") == tid and x.get("to") == pid and x.get("type") == "founded"
               for x in pedges)


if __name__ == "__main__":
    main()
