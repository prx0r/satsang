import json,sys
from sparql import q
s='''SELECT ?x ?xLabel ?xDescription ?coord ?web ?relLabel ?rel ?instLabel ?enwiki WHERE {
 ?x wdt:P17 wd:Q145; wdt:P140 ?rel; wdt:P625 ?coord .
 VALUES ?root { wd:Q748 wd:Q9089 wd:Q9316 wd:Q170208 wd:Q9603 wd:Q190 wd:Q463 wd:Q1260608 wd:Q1474884 wd:Q217039 wd:Q3043784}
 ?rel wdt:P279* ?root .
 OPTIONAL{?x wdt:P856 ?web} OPTIONAL{?x wdt:P31 ?inst}
 OPTIONAL{?enwiki schema:about ?x; schema:isPartOf <https://en.wikipedia.org/>}
 SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }'''
r=q(s); print(len(r))
json.dump(r,open('../cache/sparql_rel.json','w'),indent=0)
import collections
print(collections.Counter(b['relLabel']['value'] for b in r).most_common(40))
