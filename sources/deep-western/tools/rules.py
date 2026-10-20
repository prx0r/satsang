# Selection rules for the deep-western pass. Each channel: list of (title regex, speaker id) tried in order;
# 'default' speaker applies when no rule hits (None = skip the row). 'need' = in-scope regex the title must hit
# (None = any). 'drop' = titles to exclude (announcements, music, politics, polemics). 'cap' = max rows per speaker
# from this channel (highest views first). Lengths: whole talks 60..3600 s only (DEEP-SPEC: whole talk if <=60 min).
import re
ANN = r'trailer|coming soon|announcement|crowdfund|now available|museumnacht|summer party|kinderworkshop|welcome to the|teaser|promo|#shorts'
SCOPE_ESO = r'hermet|theurg|neoplaton|plotin|proclus|iamblich|porphyr|plato|kabbal|qabal|zohar|sefir|sufi|ibn .?arabi|rumi|esoter|occult|magic|magus|alchem|gnos|ficino|bruno|renaissance|rosicruc|boehme|böhme|swedenborg|paracels|agrippa|dee\b|astrolog|mystic|angel|daimon|demon|soul|divine|god|afterlife|heaven|hell|apocalyp|merkav|hekhalot|enoch|solomon|grimoire|goetia|tarot|corbin|jung|imaginal|theosoph|steiner|gurdjieff|eckhart|dionys|orph|pythag|hermes|egypt|mystery|mysteries|initiation|ritual|prayer|contemplat'
CH = {
 'esoterica': dict(channel='ESOTERICA', default='justin-sledge', need=SCOPE_ESO, drop=ANN+r'|q&a|livestream|members|patreon|merch', cap=110),
 'puca': dict(channel="Angela's Symposium", rules=[(r'hanegraaff','wouter-hanegraaff')], default='angela-puca',
              need=r'hermet|theurg|neoplaton|plotin|iamblich|kabbal|qabal|sufi|esoter|alchem|gnos|plato|ficino|bruno|renaissance|occult|western magic|rosicruc|golden dawn|goetia|grimoire|magic', drop=ANN+r'|crowley|chaos magic|witch|wicca|pagan|tarot|warfare|templar|baphomet|lucid|tantra|dragon rouge|qliphot|blood|servitor|larvae|necronomicon|shingon|hoffman|online course|critical-rational|six models|old vs new|how does magic work', cap=30),
 'freemind': dict(channel='Embassy of the Free Mind', rules=[(r'hanegraaff','wouter-hanegraaff'),(r'curator.?s guided tour','embassy-curators')], default=None, drop=ANN+r'|dutch|presentatie|radio|live at|boeklancering|caminos', minsec=600),
 'cmcs': dict(channel='Centre for Myth Cosmology and the Sacred', rules=[(r'angela voss|with dr angela|dr angela voss','angela-voss'),(r'tarnas','becca-tarnas'),(r'rowlandson','william-rowlandson'),(r'cornelius','geoffrey-cornelius'),(r'livingstone','louise-livingstone'),(r'patrick curry','patrick-curry'),(r'kastrup','bernardo-kastrup'),(r'simon wilson','simon-wilson'),(r'attwood','mary-attwood')], default=None, drop=ANN+r'|discover art to your inbox|discovering art to your inbox|taylor swift|brexit|diploma'),
 'kingsley': dict(channel='peterkingsleyvideo', default='peter-kingsley', drop=r'trailer'),
 'prometheus': dict(channel='Prometheus Trust', default='prometheus-trust'),
 'cheetham': dict(channel='Tom Cheetham', default='tom-cheetham', drop=r'twombly|octopus'),
 'vervaeke': dict(channel='John Vervaeke’s Lectern', rules=[(r'charles stang','charles-stang')], default='john-vervaeke',
                  need=r'neoplaton|plotin|proclus|corbin|jung|daimon|sufi|kabbal|hermet|gnos|mystic|eckhart|socrat|plato|sacred|contemplat|relig|divine|god|awakening from the meaning crisis|wisdom|transcend|spiritual|christ|buddh|zen|logos|sophia', drop=ANN+r'\bai\b|machine|politic|protest|racism', cap=60),
 'mcgilchrist': dict(channel='Dr Iain McGilchrist', default='iain-mcgilchrist', need=r'sacred|god|relig|spirit|mystic|conscious|soul|meaning|matter with things|hemispher|wisdom|death|beauty|value|truth|reality|eckhart|christ|myth|imagin|intuition|whitehead|heidegger|cosm|divine|transcend|love|purpose', drop=ANN, cap=70),
 'kastrup': dict(channel='Bernardo Kastrup 🇪🇺', default='bernardo-kastrup', drop=ANN, cap=45),
 'essentia': dict(channel='Essentia Foundation', rules=[(r'mcgilchrist|lain mcgilchrist','iain-mcgilchrist'),(r'kastrup','bernardo-kastrup')], default=None, drop=ANN),
 'rumicenter': dict(channel='Rumi Center for Spirituality & the Arts', rules=[(r'chittick','william-chittick'),(r'baraka','baraka-blue'),(r'tenour','medina-tenour')], default=None, drop=ANN, cap=40),
 'worldwisdom': dict(channel='WorldWisdomInc', rules=[(r'nasr','seyyed-hossein-nasr'),(r'lings','martin-lings'),(r'huston smith','huston-smith'),(r'chittick','william-chittick'),(r'cutsinger','james-cutsinger'),(r'stoddart','william-stoddart'),(r'frithjof schuon \(|schuon summarizes|schuon \(1907','frithjof-schuon'),(r'kazemi','reza-shah-kazemi'),(r'michon','jean-louis-michon')], default=None, drop=ANN),
 'safi': dict(channel='Omid Safi', default='omid-safi', drop=ANN+r'|iran|israel|\bus\b|ceasefire|gaza|war\b|regime|whiteness|dr\.? king|apartheid|azan|adhan|noheh|song|tours?\b|umrah|courses|haydar|occupation|genocide|journey to morocco|zionis|cnn|andrew tate|ms\. marvel|mlk|martin luther king|september 11|salawat|performed by|valentine|alumni|lent sermon', cap=60),
 'sufilive': dict(channel='SufiLive', rules=[(r'hisham','hisham-kabbani'),(r'dr\.? nour|shaykh nour','nour-kabbani'),(r'nazim','nazim-al-haqqani')], default=None, drop=r'virus|pope|declaration|bury the dead|star of ahmad|du`a for|salawats|gaza|bangladesh|kenya|tanzania|indonesia|charity|distribution|orphan|janaza|report|qurban|urs\b|tribute|mawlid|salat|fixup|well construction|hospital|surger|bread|flour|meal|clothing|water', cap=45),
 'inayati': dict(channel='Inayatiyya', rules=[(r'pir zia','pir-zia-inayat-khan')], default=None, drop=ANN, cap=80),
 'nimatullahi': dict(channel='Nimatullahi Sufi Order سلسله نعمت‌اللهی', rules=[(r'alireza nurbakhsh','alireza-nurbakhsh'),(r'javad nurbakhsh','javad-nurbakhsh'),(r'sufi stories','nimatullahi-order')], default='nimatullahi-order', drop=r'khaniqhah|melody'),
 'wccm': dict(channel='meditatiowccm', rules=[(r'laurence|freeman','laurence-freeman'),(r'john main','john-main'),(r'bachelard','sarah-bachelard'),(r'consiglio|fr cyprian','cyprian-consiglio')], default=None, drop=ANN+r'|eucharist|invitation|invites|birthday|ukraine|introducing the', cap=80),
 'cac': dict(channel='Center for Action and Contemplation', rules=[(r'bourgeault','cynthia-bourgeault'),(r'finley','james-finley'),(r'barbara holmes','barbara-holmes'),(r'mirabai','mirabai-starr'),(r'rohr(?!.s .?daily)','richard-rohr')], default=None, drop=ANN+r'|daily meditations|daily meditat|bonaventure|enneagram (types|origin)|book trailer'),
 'wwok': dict(channel='Wisdom Way of Knowing', rules=[(r'bourgeault','cynthia-bourgeault')], default=None, drop=ANN+r'|chant|delio'),
 'abc': dict(channel='The Archbishop of Canterbury', rules=[(r'rowan','rowan-williams')], default=None, drop=r'step down|covenant|women bishops|a rocha|9/11|climate|dawkins|blair'),
 'lumen': dict(channel='Lumen Christi Institute', rules=[(r'mcginn','bernard-mcginn')], default=None),
 'spyridon': dict(channel='Father Spyridon', default='father-spyridon', need=r'pray|jesus prayer|heart|passion|humil|love for god|acquire love|repent|death|soul|silen|ascet|ladder|saint|elder|hesych|still|peace|despair|pride|tears|watchful|nep|forgiv|mind|kingdom of god|inner|stress|anxiety|thought|fast|confession|grace|holy spirit|theosis|contempl', drop=r'television|last days|half-hearted|warnings from|evolution|white men|war\b|battle|false teacher|mark to come|antichrist|enem|lgbt|politic|tv & phone|noah|few will be saved|remove from our lives|demon|evil', cap=40),
 'artgreen': dict(channel='Neo Hasidim by Art Green', rules=[(r'art green','arthur-green')], default=None, drop=r'[\u0590-\u05FF]'),
 'wolfson': dict(channel='Elliot R Wolfson media', default='elliot-wolfson'),
 'seekers': dict(channel='Seekers of Unity', rules=[(r'moshe idel|idel','moshe-idel'),(r'arthur green','arthur-green'),(r'wolfson','elliot-wolfson')], default=None),
}
# rows found by in-channel search (raw/chsearch1.json), keyed by search key prefix -> rules
SEARCH = {
 'csp': dict(channel='CSP - Community Scholar Program', rules=[(r'daniel c?\.? ?matt','daniel-matt')], default=None),
 'hebrewcollege': dict(channel='Hebrew College', rules=[(r'arthur green|radical judaism|art green','arthur-green')], default=None, drop=r'installation|birthday|ceo'),
 'mishlove': dict(channel='New Thinking Allowed with Jeffrey Mishlove', rules=[(r'versluis','arthur-versluis'),(r'with tom cheetham','tom-cheetham')], default=None, drop=r'4k reboot'),
 'lumen': dict(channel='Lumen Christi Institute', rules=[(r'mcginn','bernard-mcginn')], default=None),
 'essentia': dict(channel='Essentia Foundation', rules=[(r'mcgilchrist|lain mcgilchrist','iain-mcgilchrist'),(r'kastrup','bernardo-kastrup')], default=None),
}
# school per speaker (tradition = most specific node), region = family
SP = {
 'justin-sledge':('esoteric','western-esotericism-scholarship'),'angela-puca':('esoteric','western-esotericism-scholarship'),
 'wouter-hanegraaff':('esoteric','hermeticism'),'embassy-curators':('esoteric','hermeticism'),'arthur-versluis':('esoteric','western-esotericism-scholarship'),
 'angela-voss':('platonic','renaissance-platonism'),'becca-tarnas':('esoteric','archetypal-cosmology'),'william-rowlandson':('esoteric','imaginal'),
 'geoffrey-cornelius':('esoteric','archetypal-cosmology'),'louise-livingstone':('esoteric','imaginal'),'patrick-curry':('esoteric','imaginal'),
 'simon-wilson':('esoteric','imaginal'),'mary-attwood':('platonic','renaissance-platonism'),
 'peter-kingsley':('platonic','presocratic-mysticism'),'prometheus-trust':('platonic','neoplatonism'),'tom-cheetham':('esoteric','imaginal'),
 'john-vervaeke':('philosophy-of-the-sacred','philosophy-of-the-sacred'),'charles-stang':('platonic','neoplatonism'),
 'iain-mcgilchrist':('philosophy-of-the-sacred','philosophy-of-the-sacred'),'bernardo-kastrup':('philosophy-of-the-sacred','analytic-idealism'),
 'william-chittick':('sufism','akbarian'),'baraka-blue':('sufism','mevlevi-rumi'),'medina-tenour':('sufism','sufism'),
 'seyyed-hossein-nasr':('sufism','perennialism'),'martin-lings':('sufism','perennialism'),'huston-smith':('philosophy-of-the-sacred','perennialism'),
 'james-cutsinger':('philosophy-of-the-sacred','perennialism'),'william-stoddart':('philosophy-of-the-sacred','perennialism'),'frithjof-schuon':('sufism','perennialism'),
 'reza-shah-kazemi':('sufism','perennialism'),'jean-louis-michon':('sufism','perennialism'),
 'omid-safi':('sufism','sufism'),'hisham-kabbani':('sufism','naqshbandi'),'nour-kabbani':('sufism','naqshbandi'),'nazim-al-haqqani':('sufism','naqshbandi'),
 'pir-zia-inayat-khan':('sufism','inayati'),'alireza-nurbakhsh':('sufism','nimatullahi'),'javad-nurbakhsh':('sufism','nimatullahi'),'nimatullahi-order':('sufism','nimatullahi'),
 'laurence-freeman':('christian','christian-meditation-wccm'),'john-main':('christian','christian-meditation-wccm'),'sarah-bachelard':('christian','christian-meditation-wccm'),'cyprian-consiglio':('christian','christian-meditation-wccm'),
 'richard-rohr':('christian','franciscan-contemplative'),'cynthia-bourgeault':('christian','wisdom-christianity'),'james-finley':('christian','christian-mysticism'),
 'barbara-holmes':('christian','christian-mysticism'),'mirabai-starr':('christian','christian-mysticism'),'rowan-williams':('christian','christian-mysticism'),
 'bernard-mcginn':('christian','christian-mysticism'),'father-spyridon':('christian','hesychasm'),
 'arthur-green':('jewish','neo-hasidism'),'elliot-wolfson':('jewish','kabbalah'),'moshe-idel':('jewish','kabbalah'),'daniel-matt':('jewish','zohar'),
}
FAMILY_LABEL={'esoteric':'Western esotericism','platonic':'Platonism','sufism':'Sufism','christian':'Christian mysticism','jewish':'Kabbalah & Hasidism','philosophy-of-the-sacred':'Philosophers of the sacred'}
# keyword -> school override for scholar-generalists (Sledge, Puca, Vervaeke)
SCHOOL_KW=[(r'theurg|iamblich','theurgy'),(r'plotin|proclus|porphyr|neoplaton|damascius','neoplatonism'),(r'ficino|pico|renaissance plato|bruno','renaissance-platonism'),
 (r'hermet|hermes|corpus hermeticum|emerald tablet|asclepius','hermeticism'),(r'alchem','alchemy'),(r'kabbal|qabal|zohar|sefir|luria|abulafia','kabbalah'),
 (r'merkav|merkab|hekhalot|enoch','merkavah'),(r'gnos|nag hammadi|valentin|sethian|archon|demiurg','gnosticism'),(r'sufi|ibn .?arabi|rumi','sufism'),
 (r'corbin|imaginal','imaginal'),(r'jung','jungian'),(r'eckhart|dionys|cloud of unknowing|mystic','christian-mysticism'),(r'hasid','hasidism'),(r'plato|socrat|pythag|orph','platonism'),
 (r'grimoire|goetia|solomon|magic|magus|necromancy','learned-magic'),(r'rosicruc','rosicrucianism'),(r'theosoph|blavatsky','theosophy'),(r'boehme|böhme','christian-theosophy')]
