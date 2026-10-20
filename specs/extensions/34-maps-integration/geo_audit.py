#!/usr/bin/env python3
"""Geo audit: every place's coordinates validated (MAPS-INTEGRATION).

Usage:
    python3 geo_audit.py --places A.json [more...] --out geo-report.json

Checks: lat in [-90,90], lng in [-180,180], present vs missing, precision
flag present (approximate vs recorded vs GPS-published). Emits per-place
verdicts + backlog for missing/impossible coords. Never edits data.
"""
import argparse
import json
from pathlib import Path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--places", action="append", default=[])
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    rows, backlog = [], []
    for pf in a.places:
        for p in json.load(open(pf)).get("places", []):
            lat, lng = p.get("lat"), p.get("lng")
            prec = p.get("coord_precision", "")
            if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
                rows.append({"id": p["id"], "verdict": "missing"})
                backlog.append({"id": f"geo-{p['id']}-missing", "kind": "coverage-gap",
                                "file": p["id"], "reason": "no coordinates", "severity": "backlog"})
            elif not (-90 <= lat <= 90 and -180 <= lng <= 180):
                rows.append({"id": p["id"], "verdict": "impossible"})
                backlog.append({"id": f"geo-{p['id']}-impossible", "kind": "coverage-gap",
                                "file": p["id"], "reason": f"coords out of range: {lat},{lng}",
                                "severity": "blocker"})
            else:
                rows.append({"id": p["id"], "verdict": "ok",
                             "precision": prec or "unstated"})
                if not prec:
                    backlog.append({"id": f"geo-{p['id']}-precision", "kind": "coverage-gap",
                                    "file": p["id"], "reason": "coordinates lack precision flag",
                                    "severity": "backlog"})
    import collections
    v = collections.Counter(r["verdict"] for r in rows)
    Path(a.out).write_text(json.dumps({"totals": dict(v), "rows": rows, "backlog": backlog},
                                      ensure_ascii=False, indent=1))
    print(f"{dict(v)} -> {a.out} (+{len(backlog)} backlog)")


if __name__ == "__main__":
    main()
