# Hand review of geocoding and Wikidata matches (2026-10-20). Every accepted match was checked by eye
# against its label, description and OSM category in cache/wd_resolve.txt, cache/photon.json, cache/photon2.json.
WD_REJECT=set('''ksd-glasgow manjushri-kmc dechen-sheffield sheffield-buddhist-centre buddhafield karuna-bhavan
bk-global-retreat-centre nishkam-soho-road st-aidans-lindisfarne northumbria-community jarrow-st-pauls woodbrooke
bryn-celli-ddu pentre-ifan lastingham clava-cairns'''.split())
# Wikidata items accepted only for the id/coords of a closely related entity: note it
WD_NOTE={'colet-house':'Wikidata item is The Study Society (the organisation housed at Colet House)',
 'beshara-chisholme':'Wikidata item is Chisholme House, the building the Beshara School occupies',
 'alfoxton-park':'Wikidata item is Alfoxton House','walsingham-catholic':'Wikidata item is the Slipper Chapel',
 'avebury':'Wikidata item is Avebury village, which lies inside the henge','tintagel':'Wikidata item is Tintagel village',
 'little-gidding':'Wikidata item is the village','pennant-melangell':'Wikidata item is the hamlet',
 'firbank-fell':'Wikidata item is the fell','seahenge-lynn-museum':'Wikidata point is the original site at Holme-next-the-Sea; the timbers are displayed at Lynn Museum',
 'turvey-abbey':'Wikidata item is the house Turvey Abbey, home of the Monastery of Christ Our Saviour',
 'lindisfarne':'Wikidata item is the island','bardsey-island':'Wikidata item is the island','stanbrook-abbey':'Wikidata item is the community; check point is the Wass site'}
# Photon first-hit accepted at building level (name matched the place)
PH_ACCEPT=set('''hartridge imc-uk dhamma-dipa dhamma-padhana dhamma-sukhakari purelands ksd-edinburgh ksd-scarborough jamyang-london
jamyang-leeds kmc-london rigpa-london shambhala-london adhisthana taraloka dhanakosa bristol-buddhist-centre cambridge-buddhist-centre
cardiff-buddhist-centre colchester-buddhist-centre croydon-buddhist-centre manchester-buddhist-centre newcastle-buddhist-centre
north-london-buddhist-centre west-london-buddhist-centre york-buddhist-centre shrewsbury-buddhist-centre iskcon-manchester baps-leicester
swaminarayan-willesden shri-venkateswara-tividale highgatehill-murugan mahalakshmi-east-ham sanatan-mandir-wembley sivananda-london
bk-global-cooperation-house srf-london brockwood southall-gurdwara nishkam-soho-road leicester-guru-nanak-gurdwara glasgow-gurdwara
wolverhampton-gurdwara marygate-house st-aidans-lindisfarne mount-st-bernard tolleshunt-knights glasshampton hilfield-friary minsteracres
whithorn jarrow-st-pauls woodbrooke brigflatts naqshbandi-st-anns rumis-cave cambridge-central-mosque kabbalah-centre-london ts-england-hq
ts-bristol rudolf-steiner-house emerson-college botton-village swedenborg-society college-of-psychic-studies arthur-findlay-college
boleskine-house museum-witchcraft-magic warburg-institute goddess-temple clava-cairns bryn-celli-ddu pentre-ifan madron-well atlantis-bookshop
findhorn dhammakaya-london oxford-buddha-vihara lastingham knowlton-church quaker-meeting-lancaster pardshaw
gurdwara-sri-guru-tegh-bahadur-leicester guru-har-rai-west-bromwich shree-ghanapathy mandir-leicester-sanatan manjushri-kmc tekels-park camphill-aberdeen'''.split())
PH_PREC={'manjushri-kmc':'adjacent (OSM bus stop named Conishead Priory at the site)','tekels-park':'locality (estate road)',
 'camphill-aberdeen':'locality (Camphill Estate road)','whithorn':"building (St Ninian's Cave)",'ksd-edinburgh':'building (OSM node on Maritime Street, beside the published Bernard Street address)'}
PH_RENAME={'naqshbandi-st-anns':('Sheikh Nazim Sufi Centre','Tottenham, London (Suffolk Road)')}
# fallback geocodes accepted (precision from the query)
FB_REJECT=set('julian-centre-norwich krishnamurti-centre iona-community-camas gothic-image'.split())
FB_PREC_OVERRIDE={'ksd-cardiff':'street (address search returned a neighbouring property on Cowbridge Road East)',
 'glasgow-buddhist-centre':'street (Berkeley Street; venue is the Unitarian church at no. 72)','birmingham-buddhist-vihara':'building',
 'sharpham-trust':'building (Sharpham estate)','bk-global-retreat-centre':'building (Nuneham House)','glenthorne':'building',
 'ts-nottingham':'building (Theosophical Hall)'}
# reuse coordinates already verified by sources/places (same ids)
REUSE_PLACES=['holy-isle','krishnamurti-centre:brockwood','julian-centre-norwich:none']
# hand-set coordinates
MANUAL={}
# URL fixes after live checks
URL_FIX={'lam-rim-wales':'https://www.lamrimcentre.org.uk/','bhaktivedanta-manor':'https://www.krishnatemple.com',
 'iona-abbey':'https://iona.org.uk','gravesend-gurdwara':'https://gurunanakdarbar.org','caldey-abbey':'https://www.caldeyislandwales.com/',
 'ampleforth-abbey':'https://www.abbey.ampleforth.org.uk/','shree-ghanapathy':'https://ghanapathy.co.uk','samatha-trust-greenstreete':'https://samatha.org',
 'samatha-manchester':'https://samatha.org','westminster-abbey':'https://westminster-abbey.org'}
DROP=set(['compassion-wisdom','centre-of-compassion','glasgow-gurdwara-url'])  # FDCW is not a UK centre; Centre of Compassion has no published location
URL_DROP=set()
WD_FORCE={'swaminarayan-cardiff':'Q7503879','swaminarayan-oldham':'Q7503909','hindu-mandir-glasgow':'Q17568408','hindu-temple-scotland':'Q130632848'}
WD_NOTE.update({'hindu-mandir-glasgow':'Wikidata item is the building (former Christian Science church, 1 La Belle Place)','hindu-temple-scotland':'Wikidata item is the building (former Wardlawhill Church)','kilmartin-glen':'Wikidata item is the glen'})
PH_ACCEPT|=set('lam-rim-bristol saddhatissa-centre st-nons-well penmon-priory oxford-friends-meeting-house blue-idol nine-ladies sakya-ling-reading'.split())
PH_PREC.update({'penmon-priory':"building (St Seiriol's Well)",'st-nons-well':'building (the well)'})
PH3_ACCEPT={'treadwells','julian-centre-norwich','london-sri-murugan'}
PH_ACCEPT|={'vajrasana'}; PH_PREC['vajrasana']='village (Walsham-le-Willows)'
DROP|={'helios-fountain','speaking-tree','arcturus-books'}  # bookshops whose existence/location could not be verified (no site, no OSM match)
# URLs removed after reading the live page title (2026-10-20)
URL_BLOCK={'downside-abbey':'Wikidata website now serves Downside School, not the abbey community',
 'tolleshunt-knights':'thyateira.org.uk is the Greek Orthodox archdiocese, not the monastery\'s own site (the monastery is stavropegic)'}
DESC_FIX={'gothic-image':'Long-running Glastonbury publisher on earth mysteries and spirituality; its official site now presents it as a publisher, so the High Street shop is unverified.'}
