#!/usr/bin/env python3
"""Mirror the Satsang work tree into another checkout of prx0r/satsang.

Since 2026-10-25 work/wiser IS the git work tree of prx0r/satsang (it has its own .git), so the normal flow needs no
sync at all: edit in work/wiser, then `sh tools/release/release.sh "message"`. This script keeps any other clone
(e.g. work/satsang-chat/repo, a /tmp staging clone) identical to it, without copying files by hand:

  * the file set is what git would track in the source: `git ls-files --cached --others --exclude-standard`
    (so .gitignore decides; transcripts, internal/, raw/, shots/, build output never travel);
  * new files are copied, changed files overwritten, files the clone tracks but the source no longer has are removed;
  * paths owned by other agents (engine/, specs/TEXT-TO-PRACTICE.md) are left alone unless --all.

usage: python3 tools/release/sync.py <source work tree> <clone> [--all] [--dry]
       python3 tools/release/sync.py --pull <clone>      # just fast-forward a clone to origin/main (cheapest mirror)
"""
import filecmp, os, re, shutil, subprocess, sys

OWNED = re.compile(r'^(engine/|specs/TEXT-TO-PRACTICE\.md$)')
NEVER = re.compile(r'(^|/)\.git/|transcript|(^|/)internal/|\.pyc$|(^|/)\.env$|(^|/)\.dev\.vars$')


def git(cwd, *a):
    return subprocess.run(['git', *a], cwd=cwd, capture_output=True, text=True, check=True).stdout


def files(cwd, untracked=True):
    a = ['ls-files', '-z', '--cached'] + (['--others', '--exclude-standard'] if untracked else [])
    return {f for f in git(cwd, *a).split('\0') if f and os.path.isfile(os.path.join(cwd, f))}


def main(argv):
    if argv and argv[0] == '--pull':
        print(git(argv[1], 'pull', '--rebase', '--quiet', 'origin', 'main') or 'pulled'); return 0
    args = [a for a in argv if not a.startswith('--')]
    if len(args) != 2: print(__doc__); return 2
    src, dst = map(os.path.abspath, args)
    take_all, dry = '--all' in argv, '--dry' in argv
    keep = lambda f: not NEVER.search(f) and (take_all or not OWNED.search(f))
    want = {f for f in files(src) if keep(f)}
    have = {f for f in files(dst, untracked=False) if keep(f)}
    added = changed = removed = 0
    for f in sorted(want):
        s, d = os.path.join(src, f), os.path.join(dst, f)
        if os.path.isfile(d) and filecmp.cmp(s, d, shallow=False): continue
        new = not os.path.exists(d)
        print('A' if new else 'M', f)
        if not dry: os.makedirs(os.path.dirname(d) or '.', exist_ok=True); shutil.copy2(s, d)
        added += new; changed += not new
    for f in sorted(have - want):
        print('D', f)
        if not dry: os.remove(os.path.join(dst, f))
        removed += 1
    print(f'{"would sync" if dry else "synced"}: {added} added, {changed} changed, {removed} removed '
          f'({"all paths" if take_all else "engine/ + specs/TEXT-TO-PRACTICE.md left to their owners"})')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
