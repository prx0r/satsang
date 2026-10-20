# Channel + speaker + school configuration for the deep-tantra pass (2026-10-20).
import re

# channel id -> (default speaker id or None, carrier, default school, filter mode)
# filter: 'all' = every talk on the channel is in scope; 'rel' = title/snippet must match REL; 'spk' = a known speaker must be named
CHANNELS = {
 'UCKYC_hMs3JRWaM_dfi_BnxA': ('swami-lakshmanjoo', 'archive', 'kashmir-shaivism', 'all'),       # Lakshmanjoo Academy (official archive/publisher)
 'UCy5lVhjiaB5PTX_bmF9WPpg': ('swami-lakshmanjoo', 'devotee-archive?', 'kashmir-shaivism', 'all'), # "Swami Lakshman Joo" channel, provenance unverified -> more voices
 'UCpESGVz_4KaI3duvhfedf7g': ('christopher-wallis', 'own', 'kashmir-shaivism', 'all'),
 'UCClkz6uUY4Tx0UEr5N309BA': ('christopher-wallis', 'own-org', 'kashmir-shaivism', 'all'),         # Tantra Illuminated (Wallis's school)
 'UCCtaaRRaXy9ZBxqm2XGYbFw': ('paul-muller-ortega', 'own-org', 'kashmir-shaivism', 'all'),         # Blue Throat Yoga
 'UCtH0i0x4aXHU5A5E2w6FwEw': ('shambhavi-sarasvati', 'own-org', 'kashmir-shaivism', 'all'),        # Jaya Kula
 'UCKsODXm9W-YlzfBwtysqeGQ': ('sally-kempton', 'estate', 'kashmir-shaivism', 'all'),
 'UCgKiophtgw6ITpEXMOp-00g': ('amritananda', 'own-org', 'sri-vidya', 'all'),                       # Devipuram
 'UCljRqClLfROAgwASugyWmUg': ('bettina-baumer', 'own', 'kashmir-shaivism', 'all'),
 'UCBlaoDcDD_IME_e3Jv2_cBQ': ('swami-shankarananda', 'own-org', 'kashmir-shaivism', 'all'),       # Shiva Ashram
 'UCr6mOJAX2uZUUQhSUq2TR_Q': ('bodhinatha-veylanswami', 'own-org', 'shaiva-siddhanta', 'all'),    # Kauai's Hindu Monastery
 'UCq0pz3puqJJpnm3vQsMwtgw': ('sadhguru', 'own-org', 'shakta', 'all'),                             # Linga Bhairavi (Isha)
 'UC9fBUt92Z2MW0hbsvVN3QMg': ('igor-kufayev', 'own', 'kashmir-shaivism', 'all'),
 'UChY48I4uKBGENQJbEeRt7QA': ('rajarshi-nandy', 'own', 'shakta', 'all'),
 'UCwtlV72fzO2BCmphUT16Fag': ('yamajit', 'own-org', 'krama', 'all'),
 'UCM6kXQ2n4BH-7Oci53SSffw': ('amitabh-trika-school', 'own-org', 'kashmir-shaivism', 'all'),
 'UCfqYeqSPekWE6tQEZHTnx1w': ('om-swami', 'own', 'sri-vidya', 'rel'),
 'UCM70OPD8B3DX4XI93Mdts0Q': (None, 'institution', 'tantra-studies', 'spk'),   # Oxford Centre for Hindu Studies
 'UCi0HZnDagrTn31Ae0tzTFTg': (None, 'institution', 'tantra-studies', 'spk'),   # SOAS Centre of Yoga Studies
 'UC4wAYkt8_U1TJOfXkfpjAsw': ('sthaneshwar-timalsina', 'own-org', 'kashmir-shaivism', 'all'), # Vimarsha Foundation (Timalsina's)
 'UC_yvYg_NrI74IviUUjUEWiQ': (None, 'publisher', 'tantra-studies', 'spk'),     # Embodied Philosophy
 'UCbbrX9eeSQiWYHkzbqjvrpg': (None, 'publisher', 'hatha', 'spk'),               # Yogic Studies
 'UCoydhtfFSk1fZXNRnkGnneQ': ('justin-sledge', 'own', 'tantra-studies', 'rel'),
 'UCr4VykyDuDsD26uGaNDoIYQ': (None, 'publisher', 'hatha', 'spk'),               # Keen on Yoga podcast
 'UCG9_3MP30-PDAMuEte8HUNw': (None, 'publisher', 'tantra-studies', 'spk'),      # Science and Nonduality
 'UCi1Yd0I01shhy-uknz-SQBQ': (None, 'institution', 'hatha', 'spk'),             # Smithsonian NMAA
 'UCDy2RvseIW8ZPY4z7rBVfNg': (None, 'institution', 'hatha', 'spk'),             # British Museum
 'UCjnWysJh9-r9wo82zlbMT3A': (None, 'institution', 'hatha', 'spk'),             # Brown
 'UCzofJ1X3IBvCD22fZ9PcBkA': (None, 'institution', 'tantra-studies', 'spk'),    # LMU Yoga Studies
 'UCTglIUBtUn7885IUQXfcGNg': (None, 'institution', 'hatha', 'spk'),             # Balliol
 'UCwlZZGmE1e_6PI2e-HOPOQw': (None, 'institution', 'tantra-studies', 'spk'),    # SOAS
 'UCq4FSmoqt_jFa4rL5WZBqfw': (None, 'institution', 'tantra-studies', 'spk'),    # ELTE
 'UCcAWkY-P7FOqkny32mTrHsg': (None, 'institution', 'shaiva-siddhanta', 'spk'),  # EFEO
 'UCWo0JwlldgP3A0-G1PocruQ': (None, 'institution', 'shaiva-siddhanta', 'spk'),  # Heidelberg KRS
 'UCypfitkcldmX1CpAqCp7PKw': (None, 'publisher', 'tantra-studies', 'spk'),      # Religious Studies Project
 'UCLt3gkPjKHipFC0Zt2Wl1_w': (None, 'publisher', 'sri-vidya', 'spk'),           # Glo
 'UCXUual5wNUmJxnpMvYiBRUw': (None, 'publisher', 'sri-vidya', 'spk'),           # Sivana
 'UC9dRb4fbJQIbQ3KHJZF_z0g': ('filip-holm', 'own', 'tantra-studies', 'rel'),    # Let's Talk Religion
 'UC3nhAUpe7aBm1rFCBgoWWcA': (None, 'publisher', 'tantra-studies', 'spk'),      # Sangam Talks
 'UCUsrA1iG189z9FDfQpyeuYg': ('rajmani-tigunait', 'own-org', 'sri-vidya', 'rel'),   # Himalayan Institute
 'UCMZcs6C49M_z3MfhG3S5wxQ': ('swami-khecaranatha', 'own-org', 'kashmir-shaivism', 'all'), # Heart of Consciousness
 'UC3E1t0fC_wB5sfR6BZQz8xA': ('daniel-odier', 'own', 'kashmir-shaivism', 'all'),
}
CHANNEL_NAMES = {}  # filled from pool

# speaker id -> (display name, regex on title/snippet, role, home school)
SPEAKERS = {
 'swami-lakshmanjoo': ('Swami Lakshmanjoo', r'lakshman ?joo|lakshmanjoo|swamiji', 'teacher', 'kashmir-shaivism'),
 'john-hughes': ('John Hughes', r'john hughes', 'teacher', 'kashmir-shaivism'),
 'christopher-wallis': ('Christopher Wallis (Hareesh)', r'christopher (d\. )?wallis|hareesh', 'teacher', 'kashmir-shaivism'),
 'paul-muller-ortega': ('Paul Muller-Ortega', r'muel?ller[- ]ortega', 'teacher', 'kashmir-shaivism'),
 'shambhavi-sarasvati': ('Shambhavi Sarasvati', r'shambhavi', 'teacher', 'kashmir-shaivism'),
 'sally-kempton': ('Sally Kempton', r'sally kempton|\bkempton\b', 'teacher', 'kashmir-shaivism'),
 'amritananda': ('Guruji Amritananda (Devipuram)', r'amritananda|guruji', 'teacher', 'sri-vidya'),
 'bettina-baumer': ('Bettina Sharada Bäumer', r'b[aä]e?umer', 'scholar', 'kashmir-shaivism'),
 'swami-shankarananda': ('Swami Shankarananda', r'shankarananda', 'teacher', 'kashmir-shaivism'),
 'bodhinatha-veylanswami': ('Satguru Bodhinatha Veylanswami', r'bodhinatha|satguru', 'teacher', 'shaiva-siddhanta'),
 'sadhguru': ('Sadhguru (Jaggi Vasudev)', r'sadhguru', 'teacher', 'shakta'),
 'igor-kufayev': ('Igor Kufayev', r'kufayev', 'teacher', 'kashmir-shaivism'),
 'rajarshi-nandy': ('Rajarshi Nandy', r'rajarshi nandy', 'teacher', 'shakta'),
 'yamajit': ('Yamajit (Tridevi Chamunda Mandir)', r'yamajit', 'teacher', 'krama'),
 'amitabh-trika-school': ('Amitabh (Trika School of Tantra)', r'amitabh', 'teacher', 'kashmir-shaivism'),
 'om-swami': ('Om Swami', r'\bom swami', 'teacher', 'sri-vidya'),
 'alexis-sanderson': ('Alexis Sanderson', r'sanderson', 'scholar', 'tantra-studies'),
 'dominic-goodall': ('Dominic Goodall', r'goodall', 'scholar', 'shaiva-siddhanta'),
 'judit-torzsok': ('Judit Törzsök', r't[oö]rzs[oö]k', 'scholar', 'kaula'),
 'james-mallinson': ('James Mallinson', r'mallinson', 'scholar', 'hatha'),
 'jason-birch': ('Jason Birch', r'jason birch|\bbirch\b', 'scholar', 'hatha'),
 'mark-singleton': ('Mark Singleton', r'singleton', 'scholar', 'hatha'),
 'shaman-hatley': ('Shaman Hatley', r'hatley', 'scholar', 'kaula'),
 'harunaga-isaacson': ('Harunaga Isaacson', r'isaacson', 'scholar', 'vajrayana'),
 'somadeva-vasudeva': ('Somadeva Vasudeva', r'somadeva vasudeva|som ?dev vasudeva|\bvasudeva\b(?! keshava)', 'scholar', 'kashmir-shaivism'),
 'csaba-kiss': ('Csaba Kiss', r'csaba kiss', 'scholar', 'kaula'),
 'andre-padoux': ('André Padoux', r'padoux', 'scholar', 'tantra-studies'),
 'loriliai-biernacki': ('Loriliai Biernacki', r'biernacki', 'scholar', 'kashmir-shaivism'),
 'david-gordon-white': ('David Gordon White', r'david gordon white|david g\. white|\bdgw\b', 'scholar', 'siddha-siddhanta'),
 'gavin-flood': ('Gavin Flood', r'gavin flood', 'scholar', 'tantra-studies'),
 'douglas-brooks': ('Douglas Brooks', r'douglas (r\. )?brooks|doug brooks', 'scholar', 'sri-vidya'),
 'mark-dyczkowski': ('Mark Dyczkowski', r'dyczkowski', 'scholar', 'kashmir-shaivism'),
 'sthaneshwar-timalsina': ('Sthaneshwar Timalsina', r'timalsina|sthaneshwar', 'scholar', 'kashmir-shaivism'),
 'justin-sledge': ('Justin Sledge', r'sledge', 'scholar', 'tantra-studies'),
 'filip-holm': ('Filip Holm', r'filip holm', 'educator', 'tantra-studies'),
 'ben-williams': ('Ben Williams', r'ben williams', 'scholar', 'kashmir-shaivism'),
 'isabelle-ratie': ('Isabelle Ratié', r'rati[eé]', 'scholar', 'kashmir-shaivism'),
 'peter-daniel-szanto': ('Péter-Dániel Szántó', r'sz[aá]nt[oó]', 'scholar', 'vajrayana'),
 'nina-mirnig': ('Nina Mirnig', r'mirnig', 'scholar', 'shaiva-siddhanta'),
 'peter-bisschop': ('Peter Bisschop', r'bisschop', 'scholar', 'pashupata'),
 'alex-watson': ('Alex Watson', r'alex watson', 'scholar', 'shaiva-siddhanta'),
 'diwakar-acharya': ('Diwakar Acharya', r'diwakar acharya', 'scholar', 'pashupata'),
 'bjarne-wernicke-olesen': ('Bjarne Wernicke-Olesen', r'wernicke', 'scholar', 'kaula'),
 'daniela-bevilacqua': ('Daniela Bevilacqua', r'bevilacqua', 'scholar', 'hatha'),
 'elizabeth-de-michelis': ('Elizabeth De Michelis', r'de michelis', 'scholar', 'hatha'),
 'suzanne-newcombe': ('Suzanne Newcombe', r'newcombe', 'scholar', 'hatha'),
 'matthew-clark': ('Matthew Clark', r'matthew clark', 'scholar', 'siddha-siddhanta'),
 'seth-powell': ('Seth Powell', r'seth powell', 'scholar', 'hatha'),
 'jacob-dalton': ('Jacob Dalton', r'jacob dalton', 'scholar', 'vajrayana'),
 'david-gray': ('David B. Gray', r'david (b\. )?gray', 'scholar', 'vajrayana'),
 'christian-wedemeyer': ('Christian Wedemeyer', r'wedemeyer', 'scholar', 'vajrayana'),
 'ian-baker': ('Ian Baker', r'ian baker', 'scholar', 'vajrayana'),
 'jeffrey-lidke': ('Jeffrey Lidke', r'lidke', 'scholar', 'sri-vidya'),
 'hamsa-stainton': ('Hamsa Stainton', r'stainton', 'scholar', 'kashmir-shaivism'),
 'john-nemec': ('John Nemec', r'nemec', 'scholar', 'kashmir-shaivism'),
 'sanjukta-gupta': ('Sanjukta Gupta', r'sanjukta gupta', 'scholar', 'sri-vidya'),
 'jurgen-hanneder': ('Jürgen Hanneder', r'hanneder', 'scholar', 'kashmir-shaivism'),
 'raffaele-torella': ('Raffaele Torella', r'torella', 'scholar', 'kashmir-shaivism'),
 'jeffrey-kripal': ('Jeffrey Kripal', r'kripal', 'scholar', 'shakta'),
 'rachel-mcdermott': ('Rachel Fell McDermott', r'mcdermott', 'scholar', 'shakta'),
 'sravana-borkataky-varma': ('Sravana Borkataky-Varma', r'borkataky', 'scholar', 'shakta'),
 'vidya-dehejia': ('Vidya Dehejia', r'dehejia', 'scholar', 'kaula'),
 'gudrun-buhnemann': ('Gudrun Bühnemann', r'b[uü]hnemann', 'scholar', 'tantra-studies'),
 'anya-foxen': ('Anya Foxen', r'foxen', 'scholar', 'hatha'),
 'sivaya-subramuniyaswami': ('Satguru Sivaya Subramuniyaswami (Gurudeva)', r'gurudeva|subramuniyaswami', 'teacher', 'shaiva-siddhanta'),
 'rajmani-tigunait': ('Pandit Rajmani Tigunait', r'tigunait', 'teacher', 'sri-vidya'),
 'swami-khecaranatha': ('Swami Khecaranatha', r'khecaranatha', 'teacher', 'kashmir-shaivism'),
 'daniel-odier': ('Daniel Odier', r'odier', 'teacher', 'kashmir-shaivism'),
 'eric-baret': ('Éric Baret', r'baret', 'teacher', 'kashmir-shaivism'),
 'kavitha-chinnaiyan': ('Kavitha Chinnaiyan', r'chinnaiyan', 'teacher', 'sri-vidya'),
 'christopher-tompkins': ('Christopher Tompkins', r'tompkins', 'scholar', 'kaula'),
 'lorin-roche': ('Lorin Roche', r'lorin roche', 'teacher', 'kashmir-shaivism'),
 'mary-reilly-nichols': ('Mary Reilly Nichols', r'reilly nichols', 'teacher', 'kashmir-shaivism'),
 'june-mcdaniel': ('June McDaniel', r'mcdaniel', 'scholar', 'shakta'),
 'debra-diamond': ('Debra Diamond', r'debra diamond', 'scholar', 'kaula'),
 'raj-balkaran': ('Raj Balkaran', r'balkaran', 'scholar', 'shakta'),
 'knut-jacobsen': ('Knut A. Jacobsen', r'jacobsen', 'scholar', 'shakta'),
 'edwin-bryant': ('Edwin Bryant', r'edwin bryant', 'scholar', 'hatha'),
}

SCHOOL_RX = [
 ('pratyabhijna', r'pratyabhij|recognition sutras|utpaladeva|\bi[sś]vara[- ]?pratyabhij'),
 ('spanda', r'spanda|vibration|pulsation'),
 ('krama', r'\bkrama\b|12 k[aā]l[iī]s|twelve k[aā]l[iī]s|mah[aā]rtha|kalasankarshini'),
 ('kaula', r'\bkaula|kula ?m[aā]rga|kulārṇava|kularnava|yogin[iī]|kubjik|brahmay[aā]mala|picumata|matsyendra'),
 ('trika', r'\btrika\b|m[aā]lin[iī]vijay|tantr[aā]loka|tantraloka|abhinava|parātrī|paratrisika|tantrasara'),
 ('sri-vidya', r'sr[iī] ?vidy|shri ?vidya|srividya|lalit[aā]|tripura|sri chakra|sri yantra|shri yantra|kh?adgam[aā]l|navavara'),
 ('shakta', r'\bk[aā]l[iī]\b|mah[aā]vidy|\bdevi\b|goddess|shakti|śakti|durga|navaratri|navratri|bhairav[iī]|t[aā]r[aā]\b|kamakhya|chamunda'),
 ('shaiva-siddhanta', r'siddh[aā]nta|saiva siddhanta|śaivasiddh|agama|āgama|kira[nṇ]a|ni[sś]v[aā]sa'),
 ('pashupata', r'p[aā][sś]upata|lakul[iī][sś]a|atim[aā]rga|k[aā]p[aā]lika|lākula'),
 ('siddha-siddhanta', r'n[aā]th(a)? (yogi|sampradaya|tradition)|\bn[aā]tha|gorakh|gorak[sṣ]a|siddha siddh|indian alchem|siddha alchem|rasa ?(shastra|vidya)|rasāyana|siddhas?\b'),
 ('hatha', r'ha[tṭ]ha|\b[aā]sanas?\b|kh?ecar|mudr[aā]|pr[aā][nṇ][aā]y[aā]ma|amaraugha|amanaska|amṛtasiddhi|amrtasiddhi|dattatreya|haṭhapradīpikā|hatha ?pradipika|yoga body|postur'),
 ('vajrayana', r'vajray[aā]na|tantric buddhis|buddhist tantra|yogin[iī]tantra|tibet|dzogchen|mahamudra|chakrasamvara|hevajra|cakrasa[mṃ]vara|guhyasam'),
 ('kashmir-shaivism', r'kashmir|shaivism|śaivism|saivism|shiva sutra|siva sutra|śiva-?s[uū]tra|vij[nñ][aā]na[- ]?bhairava|vigyan bhairav|lakshmanjoo|kṣemar|kshemaraja'),
]

REL = r'tantr|shaiv|śaiv|saiv|kashmir|yog|kundalin|kuṇḍalin|chakra|cakra|shakti|śakti|\bkali\b|kālī|goddess|devi\b|bhairav|mantra|sri vidya|srividya|vajray|buddhist tantra|abhinava|shiva|siva\b|śiva|hindu|india|natha?\b|gorakh|sanskrit|vedanta|upanishad|buddhis'

NONTALK = r'chant|stotra|stotram|stuti|puja|pooja|kirtan|bhajan|\bmusic\b|\bsong\b|trailer|promo|teaser|recitation|recited|aarti|arati|abhishek|celebration|birthday|homa\b|havan|hawan|registration|enrol|join us|announcement|livestream begins|coming soon|sale\b|discount|merch|webinar invite|\bad\b|#shorts|\bshorts\b|sahasranam|ashtottara|mahamantra|108 names|vandana|namosthute|homam|brahmotsav|utsav|festival|jayanti celebration|glimpses|\(fra|fra\)|\(fre|\(ita|\(esp|\(bra\)|fra-|la danse|rien à|la transmission|les micropratiques|strength training|yoga class|minute yoga|restorative yoga|pose and its'

# channel-specific must-match filters (title+snippet)
CHAN_MUST = {
 'UCUsrA1iG189z9FDfQpyeuYg': r'tigunait|sri ?vidya|srividya|tantra|mantra|shakti|kundalini|chakra|yantra|sri sukta|goddess|devi\b|shiva|saundarya',
 'UCq0pz3puqJJpnm3vQsMwtgw': r'bhairavi|devi|sadhana|goddess|feminine|navr?at?ri|shakti',
 'UCoydhtfFSk1fZXNRnkGnneQ': r'tantr|yoga|shaiv|śaiv|kashmir|kundalin|chakra|hindu|india|sanskrit|vajray|buddhis|upanishad|vedanta|bhagavad|abhinava|shiva',
}
