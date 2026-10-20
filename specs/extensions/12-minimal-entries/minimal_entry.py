#!/usr/bin/env python3
"""Minimal-entry completeness: score every place, feed the backlog.

Usage:
    python3 minimal_entry.py --places sources/places-uk/places.json [--places EXTRA.json ...]
                             [--links main-teachers.json ...] --out scoreboard.json --backlog backlog.json

Completeness per place (all four to be minimal):
    teacher  main_teacher set (or model rotating|none), or teacher_ids non-empty (legacy credit)
    contact  contact_page/contact present
    url      url present
    bio      description present AND description_source in (official, wiser)

Writes scoreboard.json {places: {id: {complete, missing[]}}, by_tradition, totals}
and backlog.json (review-queue-shaped items, severity backlog; bio-unknown is
one aggregate item per tradition, not 316 rows of noise).
"""
import argparse
import json
from pathlib import Path

MODEL_BY_TRAD = {"goenka-vipassana": "rotating", "quaker": "none"}
# Type-based defaults (doctrine of the form, not claims about persons).
# Monasteries/retreats/ashrams/hermitages have a responsible head (single,
# name queued). Urban centres rotate teachers. Temples/pilgrimage/sites
# vary too much to default — they stay backlog without a model.
MODEL_BY_TYPE = {"centre": "rotating", "monastery": "single",
                 "retreat-centre": "single", "retreat": "single",
                 "ashram": "single", "hermitage": "single"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--places", action="append", default=[])
    ap.add_argument("--links", action="append", default=[])
    ap.add_argument("--out", required=True)
    ap.add_argument("--backlog", required=True)
    a = ap.parse_args()

    main_t, model = {}, {}
    for lf in a.links:
        for L in json.load(open(lf)).get("links", []):
            main_t[L["place"]] = (L["teacher"], L.get("conf", "high"))
            model[L["place"]] = L.get("model", "single")

    places = []
    for pf in a.places:
        places += json.load(open(pf)).get("places", [])

    rows, backlog = {}, []
    for p in places:
        pid = p["id"]
        tr = p.get("traditions", [])
        inferred = next((MODEL_BY_TRAD[t] for t in tr if t in MODEL_BY_TRAD), None)
        if inferred is None:
            inferred = MODEL_BY_TYPE.get(p.get("type"))
        m = model.get(pid, p.get("teacher_model") or inferred or "single")
        mt = main_t.get(pid, (p.get("main_teacher"), None))[0] if pid in main_t or p.get("main_teacher") else None
        has_teacher = bool(mt) or (m in ("rotating", "none")) or bool(p.get("teacher_ids"))
        has_contact = bool(p.get("contact_page") or p.get("contact"))
        has_url = bool(p.get("url"))
        bio = p.get("description_source", "unknown")
        has_bio = bool(p.get("description")) and bio in ("official", "wiser")
        missing = [k for k, ok in (("teacher", has_teacher), ("contact", has_contact),
                                   ("url", has_url), ("bio-source", has_bio)) if not ok]
        rows[pid] = {"complete": not missing, "missing": missing, "model": m,
                     "main_teacher": mt, "traditions": tr}
        for mk in missing:
            if mk == "bio-source":
                continue  # aggregated below, not per-row noise
            sev = "backlog"
            backlog.append({"id": f"entry-{pid}-{mk}", "kind": "coverage-gap",
                            "file": pid, "reason": f"place missing {mk} (model {m})",
                            "severity": sev})
    agg = {}
    for pid, r in rows.items():
        if "bio-source" in r["missing"]:
            for t in r["traditions"] or ["untraditioned"]:
                agg[t] = agg.get(t, 0) + 1
    for t, n_ in sorted(agg.items()):
        backlog.append({"id": f"entry-bio-{t}", "kind": "coverage-gap", "file": t,
                        "reason": f"{n_} descriptions need source marking (official|wiser)",
                        "severity": "backlog"})
    by_trad, tot = {}, {"places": len(rows), "complete": 0}
    for pid, r in rows.items():
        tot["complete"] += r["complete"]
        for t in r["traditions"] or ["untraditioned"]:
            b = by_trad.setdefault(t, {"places": 0, "complete": 0, "missing": {}})
            b["places"] += 1
            b["complete"] += r["complete"]
            for mk in r["missing"]:
                b["missing"][mk] = b["missing"].get(mk, 0) + 1
    Path(a.out).write_text(json.dumps({"totals": tot, "by_tradition": by_trad, "places": rows},
                                      ensure_ascii=False, indent=1))
    Path(a.backlog).write_text(json.dumps({"type": "review-queue", "items": backlog},
                                          ensure_ascii=False, indent=1))
    print(f"{tot['complete']}/{tot['places']} minimal-complete; {len(backlog)} backlog items")


if __name__ == "__main__":
    main()
