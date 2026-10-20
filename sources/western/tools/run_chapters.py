import json,concurrent.futures as F
from select_ids import VIRT
from chapters import chapters
ids=[i for v in VIRT.values() for i in v]
def go(i):
    e=json.load(open(f'../cache/cache/embed/{i}.json'))
    return chapters(i, f"{e['o_author']} {e['o_title']}")
with F.ThreadPoolExecutor(3) as ex: res=list(ex.map(go,ids))
for r in res: print(r['id'],r['found'],len(r['chapters']),r.get('err'))
