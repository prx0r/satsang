import json,sys,concurrent.futures as F
from ytsearch import search
CH={
 'kfa':'UC88A5W9XyWx7WSwthd5ykhw','kft':'UCX8wFEiD_FaLPgHM6wPD0Wg','sadler':'UCEtxsMx4qsoitFwjBdLU_gA',
 'esoterica':'UCoydhtfFSk1fZXNRnkGnneQ','ltr':'UC9dRb4fbJQIbQ3KHJZF_z0g','cac':'UCMkqKAtSgijU439fJUNHnkA',
 'wwok':'UCkQOtYKee6GBY6y4vol3FNg','rsp':'UCTuPXQlrmPfDB7YLJWywnAg','vervaeke':'UCpqDUjTsof-kTNpnyWper_Q',
 'tsew':'UCVR0mIPCyzeRpctY9I8vp7A','asa':'UCWXD6cd1bLCIKsCToG-GY8Q','needleman':'UCdwPlk0ofvoxbo9PB_1aQ3Q',
 'fof':'UCqpTSO63x1Wdn0dzeA7Sp2g','horowitz':'UCrh57VATxMZhMLz36ztIokg','sugrue':'UCFaYLR_1aryjfB7hLrKGRaQ',
 'grimes':'UCwpMRCoVgSJ-rKyV1yhWljg','goeth':'UCHd8RnL9WYIqCwH_SkPo8DQ','shambhala':'UC8jwZmQI8WbV4BjxkBZK8qQ',
}
Q={
 'kfa':['death','self','meditation','suffering','sorrow','fear','God','reincarnation','what happens after death','awareness','thought','love','desire','attachment','prayer','religious mind','silence','observer is the observed','conditioning','freedom','truth','the me','time'],
 'kft':['death','meditation','self','suffering','fear','God','reincarnation','awareness','love','thought','prayer'],
 'sadler':['Plato Phaedo','Plato Republic soul','Plotinus','Proclus','Plato Symposium','Plato Phaedrus','Meister Eckhart','Plato Meno recollection','Plato Myth of Er','Plato Timaeus','Augustine','Boethius','Pseudo-Dionysius'],
 'esoterica':['Gurdjieff','Steiner','Plotinus','reincarnation','Gnostic','Nag Hammadi','Neoplatonism','Ficino','Proclus','Plato soul','Theosophy','Eckhart','afterlife','Jesus'],
 'ltr':['Plotinus','Gnostic','Eckhart','Neoplatonism','Plato','Gurdjieff','Steiner','Theosophy','reincarnation','Jesus','prayer','Krishnamurti'],
 'cac':['Meister Eckhart','centering prayer','contemplation','true self','death','Jesus','suffering','Cynthia Bourgeault','silence','mystic','Martin Laird'],
 'wwok':['Gurdjieff','centering prayer','Bourgeault'],
 'rsp':['reincarnation','karma','death','soul','Plato','Christ','meditation','Theosophy'],
 'vervaeke':['Plotinus','Plato','gnosis','Neoplatonism','Socrates','Jesus','Eckhart','Proclus','Awakening from the Meaning Crisis'],
 'tsew':['Krishnamurti','Steiner','Gurdjieff','reincarnation','karma','death','Plato','Blavatsky'],
 'asa':['karma','reincarnation','death','Steiner','meditation','soul'],
 'needleman':['Gurdjieff','soul','time'],
 'fof':['Bourgeault','Laird','contemplation'],
 'horowitz':['Gurdjieff','Ouspensky','Gnosticism','Steiner'],
 'sugrue':['Plato','Plotinus','Augustine','Gnostic','Jesus'],
 'grimes':['Myth of Er','Plotinus','Proclus','soul','One'],
 'goeth':['English','reincarnation','karma'],
 'shambhala':['Bourgeault','Laird','Eckhart'],
}
if __name__!="__main__": raise SystemExit
jobs=[(k,q) for k in Q for q in Q[k]]
out={}
with F.ThreadPoolExecutor(4) as ex:
    for (k,q),r in zip(jobs, ex.map(lambda j: search(j[1],CH[j[0]]), jobs)):
        out[f'{k}|{q}']={'err':r.get('err'),'rows':r['rows']}
json.dump(out,open('../raw/harvest.json','w'))
errs=[k for k,v in out.items() if v['err']]
print(len(jobs),'errs',len(errs),errs[:10])
