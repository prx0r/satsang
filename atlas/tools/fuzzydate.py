"""Fuzzy date DSL -> Wiser Atlas time object (SCHEMA.md §2).

  "-428..-348"   exact years (negative = BCE; there is no year 0)
  "c950..1016"   circa              "c-29"   single circa year
  "C-6"          6th century BCE    "C8..C9" century range
  "1960.."       open range (living person)    "?..866"  unknown start
  trailing "?"   low confidence; trailing "!" high confidence
  prefix "t:"    traditional (hagiographic) dating; "s:" scholarly estimate; default historical
"""
import re

CONF_RANK = {"low": 0, "medium": 1, "high": 2}
_TOK = re.compile(r"^(c)?(C)?(-?\d+|\?)?$")


def _year_label(y):
    return f"{-y} BCE" if y < 0 else f"{y}"


def _century_bounds(c):
    # C8 -> 701..800 ; C-6 -> -600..-501
    if c > 0:
        return (c - 1) * 100 + 1, c * 100
    return c * 100, (c + 1) * 100 - 1


def _ordinal(n):
    n = abs(n)
    suf = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suf}"


def _part(tok):
    """returns (start, end, circa, century, unknown)"""
    tok = tok.strip()
    if tok in ("", "?"):
        return None, None, False, False, tok == "?"
    circa = tok.startswith("c")
    if circa:
        tok = tok[1:]
    cent = tok.startswith("C")
    if cent:
        c = int(tok[1:])
        if c == 0:
            raise ValueError("century 0")
        a, b = _century_bounds(c)
        return a, b, circa, True, False
    y = int(tok)
    if y == 0:
        raise ValueError("year 0 does not exist")
    return y, y, circa, False, False


def parse(dsl):
    if dsl is None:
        return None
    raw = dsl
    basis = "historical"
    if dsl.startswith("t:"):
        basis, dsl = "traditional", dsl[2:]
    elif dsl.startswith("s:"):
        basis, dsl = "scholarly", dsl[2:]
    conf = None
    if dsl.endswith("?"):
        conf, dsl = "low", dsl[:-1]
    elif dsl.endswith("!"):
        conf, dsl = "high", dsl[:-1]
    if ".." in dsl:
        a, b = dsl.split("..", 1)
    else:
        a, b = dsl, None
    s0, s1, ca, cena, unka = _part(a)
    if b is None:
        e0, e1, cb, cenb, unkb, open_ = s0, s1, ca, cena, False, False
    elif b.strip() == "":
        e0 = e1 = None; cb = cenb = unkb = False; open_ = True
    else:
        e0, e1, cb, cenb, unkb = _part(b); open_ = False
        if b.strip() and not b.startswith("c") and ca and not cenb:
            cb = True  # "c950..1016": circa applies to the range
    circa = ca or cb
    century = cena or cenb
    start = s0
    end = e1 if not open_ else None
    if start is not None and end is not None and start > end:
        raise ValueError(f"start after end in {raw!r}")
    if conf is None:
        if basis == "traditional":
            conf = "medium" if not century else "low"
        elif century or circa:
            conf = "medium"
        elif unka or unkb:
            conf = "medium"
        else:
            conf = "high"
    precision = "century" if century else ("year" if not circa else "circa")
    # label
    def lab(x0, x1, cen, c):
        if x0 is None:
            return "?"
        if cen:
            c_ = (x1 // 100) if x1 > 0 else -((-x0) // 100)
            return f"{_ordinal(c_)} c." + (" BCE" if x0 < 0 else "")
        return ("c. " if c else "") + _year_label(x0)
    if open_:
        label = f"{lab(s0, s1, cena, ca)}–"
    elif b is None:
        label = lab(s0, s1, cena, ca)
    else:
        if unka:
            label = f"d. {_year_label(e1)}"
        else:
            la, lb = lab(s0, s1, cena, ca), lab(e0, e1, cenb, False)
            if s0 < 0 and (e1 or 0) < 0 and not cena and not cenb:
                la, lb = la.replace(" BCE", ""), lb
            if not cena and not cenb:
                label = f"{la}–{lb.replace('c. ', '')}"
            else:
                la = la.replace(' BCE', '') if (s0 < 0 and e1 < 0) else la
                if cena and cenb:
                    la = la.replace(' c.', '')
                label = f"{la}–{lb}"
    if basis == "traditional":
        label += " (traditional)"
    out = {"dsl": raw, "start": start, "end": end, "circa": circa, "precision": precision, "basis": basis,
           "confidence": conf, "label": label}
    if open_:
        out["open"] = True
    if unka:
        out["start_unknown"] = True
    return out


if __name__ == "__main__":
    for t in ["-428..-348", "c950..1016", "C-6", "C8..C9", "1960..", "?..866", "t:-563..-483", "c-29", "C6..C9?",
              "t:C2", "1343..1416?", "C20..", "c-1500..-1200", "t:c792..794", "1938"]:
        print(t, "->", parse(t))
