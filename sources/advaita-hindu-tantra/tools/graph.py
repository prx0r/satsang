# Writes people-additions.json, traditions-additions.json, edges-additions.json for the advaita-hindu-tantra group.
import json, os, collections
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
C = json.load(open('candidates.json'))
EXIST = {p['id'] for p in json.load(open('../../app/wisegraph/people.json'))['people']}

def W(id, title, kind, year=None, url=None):
    w = {'id': id, 'title': title, 'kind': kind}
    if year: w['year'] = year
    if url: w['url'] = url
    return w
def ch(name, cid, url): return [{'name': name, 'id': cid, 'url': url, 'official': True}]
SRF = ch('Self-Realization Fellowship', 'UCqr3sDl5CzjQwOHiVLal4gQ', 'https://www.youtube.com/channel/UCqr3sDl5CzjQwOHiVLal4gQ')
VSSC = ch('Vedanta Society of Southern California', 'UCoeQClkDRaj9uABKHfHJUdw', 'https://www.youtube.com/channel/UCoeQClkDRaj9uABKHfHJUdw')
RAM = ch('Sri Ramanasramam', 'UCeNlB-eW4MP1syhRGcYcEmA', 'https://www.youtube.com/@SriRamanasramam')

P = []
def add(id, name, role, tradition, traditions, wikidata, years, bio, works=(), aliases=(), channels=None, short=None, links=None, note=None):
    d = {'id': id, 'name': name, 'role': role, 'kind': role, 'tradition': tradition, 'traditions': traditions, 'wikidata': wikidata,
         'years': years, 'bio': bio, 'works': list(works), 'aliases': list(aliases)}
    if short: d['short'] = short
    if channels: d['channels'] = channels
    if links: d['links'] = links
    if id in EXIST: d['existing'] = True; d['_merge'] = 'union works/aliases/channels into the existing people.json entry; keep its bio unless this one is preferred'
    if note: d['note'] = note
    P.append(d)

# ---------------- speakers with their own official channels
add('rupert-spira', 'Rupert Spira', 'speaker', 'direct-path', ['advaita', 'direct-path'], 'Q7380364', 'b. 1960',
    'English potter turned teacher of the direct path, who points to awareness as the one reality behind all experience; a student of Francis Lucille.',
    [W('spira-transparency-of-things', 'The Transparency of Things', 'book', 2008), W('spira-nature-of-consciousness', 'The Nature of Consciousness', 'book', 2017),
     W('spira-being-aware-of-being-aware', 'Being Aware of Being Aware', 'book', 2017), W('spira-happiness-you-seek', 'You Are the Happiness You Seek', 'book', 2022)],
    ['rupert spira', 'spira'], ch('Rupert Spira', 'UCxXWjjtATq3OM545gMh9PUg', 'https://www.youtube.com/@rupertspira'), links={'Website': 'https://rupertspira.com'})
add('francis-lucille', 'Francis Lucille', 'speaker', 'direct-path', ['advaita', 'direct-path'], 'Q56314924', 'b. 1944',
    'French-born non-dual teacher in the line of Jean Klein, known for dialogues that test every claim against direct experience.',
    [W('lucille-eternity-now', 'Eternity Now', 'book', 1996), W('lucille-perfume-of-silence', 'The Perfume of Silence', 'book', 2006), W('lucille-truth-love-beauty', 'Truth Love Beauty', 'book')],
    ['francis lucille', 'lucille'], ch('Francis Lucille', 'UCAYslZlNuBDD7FMvpjWLtoQ', 'https://www.youtube.com/channel/UCAYslZlNuBDD7FMvpjWLtoQ'))
add('mooji', 'Mooji', 'speaker', 'advaita', ['advaita'], 'Q5015394', 'b. 1954',
    'Jamaican-born teacher of self-enquiry who met Papaji in Lucknow in 1993 and now teaches from Monte Sahaja in Portugal.',
    [W('mooji-before-i-am', 'Before I Am', 'book', 2012), W('mooji-white-fire', 'White Fire', 'book', 2014), W('mooji-vaster-than-sky', 'Vaster Than Sky, Greater Than Space', 'book', 2016)],
    ['mooji', 'moojibaba', 'moojiji'], ch('Moojiji', 'UCpw2gh99XM6Mwsbksv0feEg', 'https://www.youtube.com/channel/UCpw2gh99XM6Mwsbksv0feEg'))
add('adyashanti', 'Adyashanti', 'speaker', 'modern-nondual', ['independent', 'modern-nondual', 'zen'], 'Q5543094', 'b. 1962',
    'American teacher trained in Zen who now teaches awakening outside any one tradition through his Open Gate Sangha.',
    [W('adya-emptiness-dancing', 'Emptiness Dancing', 'book', 2004), W('adya-end-of-your-world', 'The End of Your World', 'book', 2008),
     W('adya-falling-into-grace', 'Falling into Grace', 'book', 2011), W('adya-most-important-thing', 'The Most Important Thing', 'book', 2019)],
    ['adyashanti', 'adya'], ch('Adyashanti', 'UCBj2I1l_ubQuWrdJV2Ns_Tg', 'https://www.youtube.com/channel/UCBj2I1l_ubQuWrdJV2Ns_Tg'),
    note='Most uploads on this channel have embedding disabled (oEmbed 401); only embeddable ones are in candidates.')
add('swami-tadatmananda', 'Swami Tadatmananda', 'speaker', 'arsha-vidya', ['vedanta', 'advaita', 'arsha-vidya'], None, None,
    'American-born monk and teacher of Advaita Vedanta and meditation at the Arsha Bodha Center in New Jersey, a disciple of Swami Dayananda Saraswati.',
    [W('tadatmananda-inner-journey', 'The Inner Journey: A Course in Meditation', 'talk series', url='https://www.youtube.com/channel/UC7i47784NqiOl244eGEJDew'),
     W('tadatmananda-deep-dive', 'Advaita Vedanta "Deep Dive" talks', 'talk series'), W('tadatmananda-gita-verse', 'Bhagavad Gita in English verse', 'talk series')],
    ['tadatmananda'], ch('ArshaBodha - Swami Tadatmananda', 'UC7i47784NqiOl244eGEJDew', 'https://www.youtube.com/channel/UC7i47784NqiOl244eGEJDew'),
    note='No clean Wikidata item found (wbsearchentities 2026-10-20).')
add('christopher-wallis', 'Christopher Wallis (Hareesh)', 'speaker', 'kashmir-shaivism', ['kashmir-shaivism'], None, 'b. 1975',
    'Sanskrit scholar and practitioner of classical Śaiva Tantra who translates and teaches the non-dual texts of Kashmir Shaivism for modern practice.',
    [W('wallis-tantra-illuminated', 'Tantra Illuminated', 'book', 2013), W('wallis-recognition-sutras', 'The Recognition Sutras', 'book', 2017),
     W('wallis-near-enemies', 'Near Enemies of the Truth', 'book', 2023), W('wallis-vbt-videos', 'Vijñāna-bhairava-tantra verse-by-verse videos', 'talk series')],
    ['christopher wallis', 'hareesh'], ch('Christopher Wallis (Hareesh)', 'UCpESGVz_4KaI3duvhfedf7g', 'https://www.youtube.com/channel/UCpESGVz_4KaI3duvhfedf7g'),
    short='Hareesh', note='Wikidata search returns only namesakes; left null.')
add('swami-lakshmanjoo', 'Swami Lakshmanjoo', 'speaker', 'kashmir-shaivism', ['kashmir-shaivism'], 'Q6479820', '1907–1991',
    'Kashmiri master regarded as the last living holder of the oral tradition of Kashmir Shaivism; his recorded teachings are kept by the Lakshmanjoo Academy.',
    [W('lj-secret-supreme', 'Kashmir Shaivism: The Secret Supreme', 'book', 1985), W('lj-shiva-sutras', 'Shiva Sutras: The Supreme Awakening', 'book', 2002),
     W('lj-vijnana-bhairava', 'Vijñāna Bhairava: The Practice of Centring Awareness', 'book', 2007), W('lj-self-realization', 'Self Realization in Kashmir Shaivism', 'book', 1995)],
    ['lakshmanjoo', 'lakshman joo', 'swamiji'], ch('Lakshmanjoo Academy', 'UCKYC_hMs3JRWaM_dfi_BnxA', 'https://www.youtube.com/channel/UCKYC_hMs3JRWaM_dfi_BnxA'),
    note='Channel is the official Lakshmanjoo Academy (publisher of his archive); clips are archival recordings of him.')
add('david-godman', 'David Godman', 'speaker', 'advaita', ['advaita'], None, 'b. 1953',
    'English writer who has lived at Tiruvannamalai since the 1970s and has written the standard books on Ramana Maharshi, his devotees and Papaji.',
    [W('godman-be-as-you-are', 'Be As You Are: The Teachings of Sri Ramana Maharshi', 'book', 1985), W('godman-living-by-the-words', 'Living by the Words of Bhagavan', 'book', 1994),
     W('godman-nothing-ever-happened', 'Nothing Ever Happened', 'book', 1998)],
    ['david godman', 'godman'], ch('David Godman', 'UCBcqQGNwcSEwlv6gJXP-U9A', 'https://www.youtube.com/channel/UCBcqQGNwcSEwlv6gJXP-U9A'),
    note='Wikidata Q5234180 is labelled David Godman but described as "Indian sage"; not used until verified.')
add('swami-sarvapriyananda', 'Swami Sarvapriyananda', 'speaker', 'ramakrishna-order', ['vedanta', 'advaita', 'ramakrishna-order'], 'Q99543109', 'b. 1969',
    'Monk of the Ramakrishna Order and head of the Vedanta Society of New York, known for clear lectures on Advaita Vedanta and consciousness.',
    [W('sarvapriyananda-ask-swami', 'Ask Swami (Q&A series)', 'talk series', url='https://www.youtube.com/channel/UCZOKv_xnTzyLD9RJmbBUV9Q'),
     W('sarvapriyananda-mandukya', 'Mandukya Upanishad lectures', 'talk series'), W('sarvapriyananda-vivekachudamani', 'Vivekachudamani classes', 'talk series')],
    ['sarvapriyananda'], ch('Vedanta Society of New York', 'UCZOKv_xnTzyLD9RJmbBUV9Q', 'https://www.youtube.com/@VedantaNY'))
# ---------------- SRF monastics (official SRF channel)
add('brother-chidananda', 'Brother Chidananda', 'speaker', 'kriya-yoga', ['kriya-yoga'], 'Q42428676', None,
    'President and spiritual head of Self-Realization Fellowship / Yogoda Satsanga Society of India since 2017, teaching Yogananda\'s Kriya Yoga path.',
    [W('chidananda-srf-talks', 'SRF Convocation and online meditation talks', 'talk series')], ['chidananda'], SRF)
add('sri-mrinalini-mata', 'Sri Mrinalini Mata', 'speaker', 'kriya-yoga', ['kriya-yoga'], 'Q111450511', '1931–2017',
    'Direct disciple of Paramahansa Yogananda, trained by him to edit his writings, and fourth president of Self-Realization Fellowship.',
    [W('mrinalini-manifesting', 'Manifesting Divine Consciousness in Daily Life', 'book')], ['mrinalini mata'], SRF)
add('sri-daya-mata', 'Sri Daya Mata', 'speaker', 'kriya-yoga', ['kriya-yoga'], 'Q5243001', '1914–2010',
    'Direct disciple of Paramahansa Yogananda who led Self-Realization Fellowship as its president for more than fifty years.',
    [W('daya-only-love', 'Only Love', 'book', 1976), W('daya-finding-the-joy', 'Finding the Joy Within You', 'book', 1990), W('daya-enter-quiet-heart', 'Enter the Quiet Heart', 'book', 1998)],
    ['daya mata'], SRF)
add('brother-anandamoy', 'Brother Anandamoy', 'speaker', 'kriya-yoga', ['kriya-yoga'], 'Q113762258', None,
    'Swiss-born monk and direct disciple of Paramahansa Yogananda who lectured for Self-Realization Fellowship for decades.', [], ['anandamoy'], SRF)
for sid, nm in [('brother-bhumananda', 'Brother Bhumananda'), ('brother-achalananda', 'Brother Achalananda'), ('brother-satyananda', 'Brother Satyananda'),
                ('brother-kamalananda', 'Brother Kamalananda'), ('brother-prafullananda', 'Brother Prafullananda'), ('brother-bhaktananda', 'Brother Bhaktananda')]:
    add(sid, nm, 'speaker', 'kriya-yoga', ['kriya-yoga'], None, None, 'Monk of the Self-Realization Fellowship order who gives talks and guided practice on Yogananda\'s teachings.', [], [nm.split()[1].lower()], SRF)
add('sister-usha', 'Sister Usha', 'speaker', 'kriya-yoga', ['kriya-yoga'], None, None, 'Nun of the Self-Realization Fellowship order who gives short talks on Yogananda\'s teachings.', [], [], SRF)
# ---------------- Ramakrishna Order speakers at the Vedanta Society of Southern California
add('swami-sarvadevananda', 'Swami Sarvadevananda', 'speaker', 'ramakrishna-order', ['vedanta', 'ramakrishna-order'], None, None,
    'Monk of the Ramakrishna Order and minister of the Vedanta Society of Southern California in Hollywood.', [W('sarvadevananda-qa', 'Vedanta short answers (VSSC)', 'talk series')], ['sarvadevananda'], VSSC)
add('swami-mahayogananda', 'Swami Mahayogananda', 'speaker', 'ramakrishna-order', ['vedanta', 'ramakrishna-order'], None, None,
    'Monk of the Ramakrishna Order at the Vedanta Society of Southern California who speaks on Vedanta, near-death experience and rebirth.', [], ['mahayogananda'], VSSC)
for sid, nm in [('swami-satyamayananda', 'Swami Satyamayananda'), ('swami-atmaghanananda', 'Swami Atmaghanananda'), ('swami-atmavidyananda', 'Swami Atmavidyananda'),
                ('swami-vedarupananda', 'Swami Vedarupananda')]:
    add(sid, nm, 'speaker', 'ramakrishna-order', ['vedanta', 'ramakrishna-order'], None, None, 'Monk of the Ramakrishna Order whose talks are published by the Vedanta Society of Southern California.', [], [nm.split()[1].lower()], VSSC)
for sid, nm in [('pravrajika-vidyaprana', 'Pravrajika Vidyaprana'), ('pravrajika-sevaprana', 'Pravrajika Sevaprana')]:
    add(sid, nm, 'speaker', 'ramakrishna-order', ['vedanta', 'ramakrishna-order'], None, None, 'Nun of the Sarada Convent of the Vedanta Society of Southern California who answers questions on Vedanta.', [], [nm.split()[1].lower()], VSSC)
# ---------------- Sri Ramanasramam speakers
add('venkat-s-ramanan', 'Dr. Venkat S. Ramanan', 'speaker', 'advaita', ['vedanta', 'advaita'], None, None,
    'President of Sri Ramanasramam in Tiruvannamalai (also known as Dr. Anand Ramanan), who speaks on Ramana Maharshi\'s teaching at the ashram\'s celebrations.', [], ['anand ramanan', 'venkat ramanan'], RAM)
add('nochur-venkataraman', 'Sri Nochur Venkataraman', 'speaker', 'advaita', ['vedanta', 'advaita'], None, None,
    'Vedanta teacher from Kerala known for long talk series on Ramana Maharshi\'s poems, several given in English at Sri Ramanasramam.',
    [W('nochur-aksharamanamalai', 'Aksharamanamalai talks at Sri Ramanasramam', 'talk series')], ['nochur'], RAM)
add('aparna-krishnamoorthy', 'Aparna Krishnamoorthy', 'speaker', 'advaita', ['vedanta', 'advaita'], None, None,
    'Speaker on the Advaitic meaning of Ramana Maharshi\'s hymns, in a talk published by Sri Ramanasramam.', [], [], RAM)
for sid, nm, b in [('ganapathi-raman', 'Ganapathi Raman', 'Devotee of Ramana Maharshi interviewed for Sri Ramanasramam\'s devotee-interview series.'),
                   ('dhiruben-patel', 'Dhiruben Patel', 'Devotee of Ramana Maharshi whose recollections were recorded by Sri Ramanasramam.'),
                   ('santa-ramachandran', 'Dr. Santa Ramachandran', 'Devotee who recalls moments with Ramana Maharshi in a recording published by Sri Ramanasramam.'),
                   ('mangalam-kalyanam', 'Mangalam Kalyanam', 'Granddaughter of Niranjanananda Swami, the ashram\'s first sarvadhikari and Ramana Maharshi\'s younger brother, recorded by Sri Ramanasramam.'),
                   ('sethulakshmi', 'Sethulakshmi', 'Devotee of Ramana Maharshi interviewed for Sri Ramanasramam\'s devotee-interview series.')]:
    add(sid, nm, 'speaker', 'advaita', ['vedanta', 'advaita'], None, None, b, [], [], RAM)

# ---------------- figures (met through talks about them; Ramana also via archival footage)
add('ramana-maharshi', 'Ramana Maharshi', 'figure', 'advaita', ['vedanta', 'advaita'], 'Q288441', '1879–1950',
    'Sage of Arunachala who woke to the Self at sixteen and taught self-enquiry, the question "Who am I?", mostly in silence and short replies.',
    [W('ramana-who-am-i', 'Who Am I? (Nan Yar)', 'text'), W('ramana-upadesa-saram', 'Upadesa Saram', 'text', 1927), W('ramana-ulladu-narpadu', 'Ulladu Narpadu (Forty Verses on Reality)', 'text', 1928),
     W('ramana-aksharamanamalai', 'Aksharamanamalai (Marital Garland of Letters)', 'text'), W('ramana-talks', 'Talks with Sri Ramana Maharshi', 'book', 1955)],
    ['ramana', 'maharshi', 'bhagavan sri ramana'], RAM, note='Sri Ramanasramam holds his archival film; one archival clip (Bhagavan With Squirrel) is in candidates with speaker=ramana-maharshi.')
add('nisargadatta-maharaj', 'Nisargadatta Maharaj', 'figure', 'inchegeri', ['advaita', 'inchegeri'], 'Q175532', '1897–1981',
    'Bombay shopkeeper and teacher of the Inchegeri line whose blunt dialogues about the sense "I am" became the book I Am That.',
    [W('nisargadatta-i-am-that', 'I Am That', 'book', 1973), W('nisargadatta-seeds', 'Seeds of Consciousness', 'book', 1982), W('nisargadatta-prior', 'Prior to Consciousness', 'book', 1985)],
    ['nisargadatta', 'nisarga'], note='No official estate YouTube channel found; met through talks by Rupert Spira, David Godman, Mooji and others on their own channels.')
add('ramakrishna', 'Sri Ramakrishna', 'figure', 'ramakrishna-order', ['vedanta', 'ramakrishna-order'], 'Q183126', '1836–1886',
    'Bengali mystic and priest at Dakshineswar who practised many paths to God and taught that they reach one truth.',
    [W('gospel-of-sri-ramakrishna', 'The Gospel of Sri Ramakrishna (Kathamrita, recorded by M.)', 'book', 1942)], ['ramakrishna', 'thakur'])
add('swami-vivekananda', 'Swami Vivekananda', 'figure', 'ramakrishna-order', ['vedanta', 'ramakrishna-order'], 'Q47478', '1863–1902',
    'Chief disciple of Ramakrishna who brought Vedanta to the West at Chicago in 1893 and founded the Ramakrishna Mission.',
    [W('vivekananda-chicago', 'Chicago Addresses', 'talk', 1893), W('vivekananda-raja-yoga', 'Raja Yoga', 'book', 1896), W('vivekananda-karma-yoga', 'Karma Yoga', 'book', 1896), W('vivekananda-jnana-yoga', 'Jnana Yoga', 'book', 1899)],
    ['vivekananda'])
add('sarada-devi', 'Sri Sarada Devi (Holy Mother)', 'figure', 'ramakrishna-order', ['vedanta', 'ramakrishna-order'], 'Q3278399', '1853–1920',
    'Wife and spiritual companion of Ramakrishna, revered in the Ramakrishna Order as the Holy Mother.',
    [W('gospel-of-holy-mother', 'The Gospel of the Holy Mother (sayings)', 'text')], ['holy mother', 'sarada devi'])
add('paramahansa-yogananda', 'Paramahansa Yogananda', 'figure', 'kriya-yoga', ['kriya-yoga'], 'Q312549', '1893–1952',
    'Indian yogi who brought Kriya Yoga to America in 1920, founded Self-Realization Fellowship and wrote Autobiography of a Yogi.',
    [W('autobiography-of-a-yogi', 'Autobiography of a Yogi', 'book', 1946), W('yogananda-god-talks-with-arjuna', 'God Talks with Arjuna: The Bhagavad Gita', 'book', 1995),
     W('yogananda-second-coming', 'The Second Coming of Christ', 'book', 2004)], ['yogananda'], SRF)
add('mahavatar-babaji', 'Mahavatar Babaji', 'figure', 'kriya-yoga', ['kriya-yoga'], 'Q741358', None,
    'Deathless Himalayan master who, in the Kriya Yoga lineage told in Autobiography of a Yogi, revived Kriya Yoga by initiating Lahiri Mahasaya in 1861.',
    [], ['babaji'], note='No writings; known through Autobiography of a Yogi.')
add('lahiri-mahasaya', 'Lahiri Mahasaya', 'figure', 'kriya-yoga', ['kriya-yoga'], 'Q471036', '1828–1895',
    'Householder yogi of Benares who received Kriya Yoga from Babaji and taught it widely while living a family life.', [], ['lahiri', 'shyama charan lahiri'])
add('sri-yukteswar', 'Swami Sri Yukteswar Giri', 'figure', 'kriya-yoga', ['kriya-yoga'], 'Q380790', '1855–1936',
    'Disciple of Lahiri Mahasaya and the guru of Paramahansa Yogananda.', [W('yukteswar-holy-science', 'The Holy Science', 'book', 1894)], ['yukteswar', 'yukteshwar'])
add('abhinavagupta', 'Abhinavagupta', 'figure', 'kashmir-shaivism', ['kashmir-shaivism'], 'Q320619', 'c. 950–1016',
    'Kashmiri philosopher who drew the Tantric schools into one non-dual system in which everything is the free self-awareness of Shiva.',
    [W('tantraloka', 'Tantrāloka', 'text'), W('tantrasara', 'Tantrasāra', 'text'), W('paramarthasara', 'Paramārthasāra', 'text'), W('gitartha-sangraha', 'Gītārtha-saṅgraha (commentary on the Bhagavad Gita)', 'text')],
    ['abhinavagupta', 'abhinava'])
add('shiva-sutras', 'Shiva Sutras of Vasugupta', 'figure', 'kashmir-shaivism', ['kashmir-shaivism'], 'Q1136787', 'c. 9th century',
    'Seventy-seven terse aphorisms, said to have been revealed to Vasugupta, that open the non-dual teaching of Kashmir Shaivism with "Consciousness is the Self".',
    [W('shiva-sutras-text', 'Śiva Sūtras', 'text')], ['shiva sutras', 'śiva sūtras'], note='kind in people.json is text; role here figure because the schema only allows speaker|figure.')
add('vijnana-bhairava', 'Vijñāna Bhairava Tantra', 'figure', 'kashmir-shaivism', ['kashmir-shaivism'], 'Q2005649', 'c. 7th–9th century',
    'Tantric dialogue between Shiva and the Goddess listing 112 ways of entering awareness, much taught in Kashmir Shaivism.',
    [W('vbt-text', 'Vijñāna Bhairava Tantra', 'text')], ['vijnana bhairava', 'vijñāna-bhairava', 'vbt'], note='Treat as kind=text.')
add('bhagavad-gita', 'Bhagavad Gita', 'figure', 'vedanta', ['vedanta'], 'Q46802', None,
    'Dialogue between Krishna and Arjuna in the Mahabharata on duty, devotion and knowledge of the Self; a root text of Vedanta.',
    [W('gita-text', 'Bhagavad Gita', 'text')], ['bhagavad gita'], note='Treat as kind=text.')
add('adi-shankara', 'Ādi Śaṅkara', 'figure', 'advaita', ['vedanta', 'advaita'], 'Q180967', 'c. 8th century',
    'Philosopher who set out Advaita Vedanta in commentaries on the Upanishads, Gita and Brahma Sutras.',
    [W('shankara-brahma-sutra-bhashya', 'Brahma Sūtra Bhāṣya', 'text'), W('shankara-upadesa-sahasri', 'Upadeśa Sāhasrī', 'text'), W('vivekachudamani', 'Vivekacūḍāmaṇi (attributed)', 'text')],
    ['shankara', 'shankaracharya', 'śaṅkara'])
add('papaji', 'H. W. L. Poonja (Papaji)', 'figure', 'advaita', ['advaita'], 'Q1033977', '1910–1997',
    'Disciple of Ramana Maharshi who taught self-enquiry in Lucknow and inspired many Western teachers, Mooji among them.',
    [W('papaji-wake-up-and-roar', 'Wake Up and Roar', 'book', 1992), W('papaji-the-truth-is', 'The Truth Is', 'book', 2000)], ['papaji', 'poonja', 'poonjaji'])
add('jean-klein', 'Jean Klein', 'figure', 'direct-path', ['advaita', 'direct-path'], 'Q1682182', '1912–1998',
    'French musicologist and doctor who taught non-dual listening and body work in Europe and America; teacher of Francis Lucille.',
    [W('klein-be-who-you-are', 'Be Who You Are', 'book', 1978), W('klein-i-am', 'I Am', 'book', 1989)], ['jean klein'])
add('atmananda-krishna-menon', 'Atmananda Krishna Menon', 'figure', 'direct-path', ['advaita', 'direct-path'], 'Q4817058', '1883–1959',
    'Kerala lawyer and sage whose "direct path" of enquiry into consciousness shaped Jean Klein, Francis Lucille and Rupert Spira.',
    [W('atmananda-atma-darshan', 'Atma Darshan', 'book', 1946), W('atmananda-atma-nirvriti', 'Atma Nirvriti', 'book', 1952), W('atmananda-notes', 'Notes on Spiritual Discourses', 'book', 1963)], ['atmananda'])
add('swami-dayananda-saraswati', 'Swami Dayananda Saraswati', 'figure', 'arsha-vidya', ['vedanta', 'advaita', 'arsha-vidya'], 'Q5243052', '1930–2015',
    'Teacher of traditional Advaita Vedanta who founded the Arsha Vidya Gurukulams and trained Swami Tadatmananda among many others.',
    [W('dayananda-value-of-values', 'The Value of Values', 'book')], ['swami dayananda'])

used = {x['speaker'] for x in C} | {f for x in C for f in x['figures']}
EDGE_IDS = {'jean-klein', 'atmananda-krishna-menon', 'swami-dayananda-saraswati', 'lahiri-mahasaya', 'sri-yukteswar', 'sri-daya-mata', 'brother-anandamoy'}
P = [p for p in P if p['id'] in used or p['id'] in EDGE_IDS or p['role'] == 'figure']
have = {p['id'] for p in P}
missing = sorted(u for u in used if u not in have and u not in EXIST)
json.dump({'_note': 'people additions from advaita-hindu-tantra sourcing 2026-10-20. role = speaker|figure (mirrors kind). Entries with existing:true are already in people.json: merge works/aliases/channels. wikidata checked via wbsearchentities 2026-10-20; null = no clean item.', 'people': P},
          open('people-additions.json', 'w'), indent=1, ensure_ascii=False)
print('people', len(P), 'existing-updates', sum(1 for p in P if p.get('existing')), 'missing for used ids:', missing)

T = [
    {'id': 'direct-path', 'label': 'Direct path', 'kind': 'lineage', 'parent': 'advaita', 'wikidata': None,
     'blurb': 'The non-dual enquiry into experience taught by Atmananda Krishna Menon and carried on by Jean Klein, Francis Lucille and Rupert Spira.'},
    {'id': 'arsha-vidya', 'label': 'Arsha Vidya', 'kind': 'lineage', 'parent': 'advaita', 'wikidata': None,
     'blurb': 'Traditional teaching of Advaita Vedanta through the texts, in the line of Swami Dayananda Saraswati (Arsha Vidya Gurukulam, Q4796497).'},
    {'id': 'modern-nondual', 'label': 'Modern non-dual teachers', 'kind': 'lineage', 'parent': 'independent', 'wikidata': None,
     'blurb': 'Contemporary teachers of awakening who draw on Zen, Advaita and other sources without belonging to one lineage.'},
]
json.dump({'_note': 'tradition node additions (same shape as app/wisegraph/traditions.json nodes)', 'nodes': T}, open('traditions-additions.json', 'w'), indent=1, ensure_ascii=False)

E = [
    ('ramana-maharshi', 'papaji', 'teacher_of', 'high', None), ('papaji', 'mooji', 'teacher_of', 'high', 'Mooji met Papaji in Lucknow in 1993.'),
    ('ramana-maharshi', 'david-godman', 'influenced', 'high', 'Godman has written on Ramana and his devotees since the 1980s.'),
    ('nisargadatta-maharaj', 'rupert-spira', 'influenced', 'medium', 'Spira reads and comments on I Am That.'),
    ('atmananda-krishna-menon', 'direct-path', 'lineage_of', 'high', None), ('atmananda-krishna-menon', 'jean-klein', 'influenced', 'medium', None),
    ('jean-klein', 'francis-lucille', 'teacher_of', 'high', None), ('francis-lucille', 'rupert-spira', 'teacher_of', 'high', None),
    ('swami-dayananda-saraswati', 'arsha-vidya', 'lineage_of', 'high', None), ('swami-dayananda-saraswati', 'swami-tadatmananda', 'teacher_of', 'high', None),
    ('adi-shankara', 'advaita', 'lineage_of', 'high', None),
    ('abhinavagupta', 'swami-lakshmanjoo', 'influenced', 'high', 'Lakshmanjoo taught Abhinavagupta\'s works line by line.'),
    ('swami-lakshmanjoo', 'kashmir-shaivism', 'influenced', 'high', 'Last holder of the oral tradition.'),
    ('swami-lakshmanjoo', 'christopher-wallis', 'influenced', 'medium', 'Wallis draws on Lakshmanjoo\'s translations and lineage.'),
    ('vijnana-bhairava', 'kashmir-shaivism', 'lineage_of', 'medium', None),
    ('lahiri-mahasaya', 'sri-yukteswar', 'teacher_of', 'high', None), ('sri-yukteswar', 'paramahansa-yogananda', 'teacher_of', 'high', None),
    ('paramahansa-yogananda', 'sri-daya-mata', 'teacher_of', 'high', None), ('paramahansa-yogananda', 'sri-mrinalini-mata', 'teacher_of', 'high', None),
    ('paramahansa-yogananda', 'brother-anandamoy', 'teacher_of', 'high', None), ('paramahansa-yogananda', 'kriya-yoga', 'influenced', 'high', 'Brought Kriya Yoga to the West.'),
    ('ramakrishna', 'sarada-devi', 'influenced', 'medium', 'Spiritual companions; Sarada Devi is revered as Holy Mother of the Ramakrishna Order.'),
    ('ramakrishna', 'ramakrishna-order', 'lineage_of', 'high', None),
    ('swami-vivekananda', 'swami-sarvapriyananda', 'influenced', 'medium', 'Sarvapriyananda is a monk of the order Vivekananda founded.'),
]
json.dump({'_note': 'edge additions (same shape as app/wisegraph/edges.json)', 'edges': [dict(**{'from': a, 'to': b, 'type': t, 'conf': c}, **({'note': n} if n else {})) for a, b, t, c, n in E]},
          open('edges-additions.json', 'w'), indent=1, ensure_ascii=False)
print('edges', len(E), 'traditions', len(T))
