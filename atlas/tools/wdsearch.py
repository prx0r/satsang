import sys, json, time, urllib.request, urllib.parse
UA = {"User-Agent": "WiserAtlas/0.1 (https://tantrafiles.xyz; tradesprior@gmail.com)"}
for line in sys.stdin:
    if '=' not in line: continue
    nid, q = line.strip().split('=', 1)
    u = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(dict(action="wbsearchentities", search=q, language="en", limit=7, format="json"))
    for i in range(3):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20)); break
        except Exception as ex: time.sleep(5)
    print(nid, '|', ' ;; '.join(f"{h['id']} {h.get('label','')} — {h.get('description','')[:50]}" for h in d.get('search', [])))
    time.sleep(0.5)
