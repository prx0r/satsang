#!/usr/bin/env python3
"""Schedule watcher: machines watch, humans record (STREAM-SPEC).

Usage:
    python3 refresh_schedules.py --places places.json [more...] --state state.json --out review-items.json

For every place with a schedule_url: fetch (short timeout, browser UA),
hash content, compare with state.json. Changed -> review item for a human
re-read. Unchanged -> re-stamp checked. Errors -> review item (dead link).
NEVER writes occurrences. NEVER invents dates. Exit 0 always (a watcher,
not a gate); failures are items, not crashes.
"""
import argparse
import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; Wiserbot/1.0)"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            if r.status != 200:
                return None, f"http {r.status}"
            return hashlib.sha256(r.read(200000)).hexdigest(), None
    except Exception as e:
        return None, f"{type(e).__name__}: {str(e)[:100]}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--places", action="append", default=[])
    ap.add_argument("--state", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    sp = Path(a.state)
    state = json.load(open(sp)) if sp.exists() else {}
    now = datetime.now(timezone.utc).date().isoformat()
    items, n_hit, n_chg, n_dead = [], 0, 0, 0
    for pf in a.places:
        for p in json.load(open(pf)).get("places", []):
            u = p.get("schedule_url") or ""
            if not u:
                continue
            h, err = fetch(u)
            prev = state.get(p["id"], {})
            if err:
                n_dead += 1
                items.append({"id": f"sched-{p['id']}-unreachable", "kind": "coverage-gap",
                              "file": p["id"], "reason": f"schedule URL unreachable: {err}",
                              "severity": "verify"})
                continue
            n_hit += 1
            if prev.get("hash") and prev["hash"] != h:
                n_chg += 1
                items.append({"id": f"sched-{p['id']}-changed", "kind": "coverage-gap",
                              "file": p["id"],
                              "reason": f"schedule page changed since {prev.get('checked')}; re-read for occurrences",
                              "severity": "verify"})
            state[p["id"]] = {"hash": h, "checked": now, "url": u}
    sp.write_text(json.dumps(state, ensure_ascii=False, indent=1))
    Path(a.out).write_text(json.dumps({"type": "review-queue", "items": items},
                                      ensure_ascii=False, indent=1))
    print(f"{n_hit} checked, {n_chg} changed, {n_dead} unreachable -> {a.out}")


if __name__ == "__main__":
    main()
