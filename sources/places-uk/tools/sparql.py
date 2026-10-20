import json,urllib.request,urllib.parse,sys,time
UA={'User-Agent':'WiserPlaces/0.2 (tradesprior@gmail.com)','Accept':'application/sparql-results+json'}
def q(s):
    u='https://query.wikidata.org/sparql?format=json&query='+urllib.parse.quote(s)
    for a in range(2):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=90))['results']['bindings']
        except Exception as e: print('ERR',e,file=sys.stderr); time.sleep(5)
    return None
CLASSES={ # label: (class qids, religion filter or None)
 'buddhist':'wd:Q5393308 wd:Q44539 wd:Q1062496 wd:Q10267 wd:Q4994349 wd:Q160742 wd:Q1144309',
 'hindu':'wd:Q842402 wd:Q2977',
 'sikh':'wd:Q11735',
 'retreat':'wd:Q1365579',
}
out={}
for k,cls in CLASSES.items():
    rel='' 
    s=f'''SELECT DISTINCT ?x ?xLabel ?xDescription ?coord ?web ?cls ?relLabel ?enwiki WHERE {{
 VALUES ?c {{ {cls} }} ?x wdt:P31/wdt:P279* ?c . ?x wdt:P17 wd:Q145 .
 OPTIONAL{{?x wdt:P625 ?coord}} OPTIONAL{{?x wdt:P856 ?web}} OPTIONAL{{?x wdt:P140 ?rel}}
 OPTIONAL{{?enwiki schema:about ?x; schema:isPartOf <https://en.wikipedia.org/>}}
 BIND(?c AS ?cls)
 SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}'''
    r=q(s); out[k]=r; print(k,len(r) if r else r)
json.dump(out,open('../cache/sparql_classes.json','w'),indent=0)
