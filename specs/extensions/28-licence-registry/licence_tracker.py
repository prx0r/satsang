#!/usr/bin/env python3
"""Licence tracker: who allows what, per organisation and tradition.

Usage:
    python3 licence_tracker.py --registry licence-registry.json --packs DIR [...] --out licence-report.json

Answers 'how do we keep track of license stuff': one registry file mapping
organisation domain (and tradition as fallback) -> default licence + evidence
+ per-book exceptions. The audit then flags every text record and every
teacher/org with talks-or-books but no licence information.

Registry shape: {domains: {host: {default, evidence, checked}},
                 traditions: {tradition: {default, evidence}},
                 books: {text_id: {licence, evidence}}}
"""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", required=True)
    ap.add_argument("--packs", action="append", default=[])
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    reg = json.load(open(a.registry))
    doms = reg.get("domains", {})
    trads = reg.get("traditions", {})
    books = reg.get("books", {})
    gaps, covered = [], []
    for pack in a.packs:
        for f in sorted(Path(pack).rglob("*.json")):
            if "__pycache__" in str(f) or "11-site-runtime" in str(f):
                continue
            try:
                d = json.load(open(f))
            except Exception:
                continue
            texts = d.get("texts", []) if isinstance(d, dict) else []
            for t in texts:
                if not isinstance(t, dict) or not t.get("id"):
                    continue
                tid = t["id"]
                if tid in books or t.get("licence"):
                    covered.append(tid)
                    continue
                link = t.get("link", "")
                host = urlparse(link).hostname or "" if link else ""
                default = None
                if host:
                    for dh, dd in doms.items():
                        if host == dh or host.endswith("." + dh):
                            default = dd.get("default")
                if default is None:
                    for tr in (t.get("school"),):
                        if tr in trads:
                            default = trads[tr].get("default")
                gaps.append({"id": tid, "file": str(f), "link": link,
                             "inferred_default": default,
                             "reason": "no licence recorded" + (f"; domain default would be {default}" if default else "")})
    out = {"tracked_books": len(covered), "gaps": gaps,
           "domains": len(doms), "traditions": len(trads)}
    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"{len(covered)} licenced, {len(gaps)} gaps -> {a.out}")


if __name__ == "__main__":
    main()
