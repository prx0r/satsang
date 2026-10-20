import re
# id, display name, title regex, tradition
T=[
 ('ajahn-brahm','Ajahn Brahm',r'ajahn ?brahm(?!ali)|brahmavamso','thai-forest'),
 ('ajahn-sumedho','Ajahn Sumedho',r'sumedho','thai-forest'),
 ('ajahn-amaro','Ajahn Amaro',r'ajahn amaro','thai-forest'),
 ('ajahn-pasanno','Ajahn Pasanno',r'pasanno','thai-forest'),
 ('ajahn-chah','Ajahn Chah',r'ajahn chah','thai-forest'),
 ('thanissaro-bhikkhu','Thanissaro Bhikkhu',r'thanissaro|ṭhānissaro|ajaan geoff','thai-forest'),
 ('thich-nhat-hanh','Thich Nhat Hanh',r'thich nhat hanh|thích nhất hạnh|thay\b','plum-village'),
 ('shunryu-suzuki','Shunryu Suzuki',r'shunryu suzuki|suzuki roshi','soto-zen'),
 ('shohaku-okumura','Shohaku Okumura',r'okumura','soto-zen'),
 ('joan-halifax','Joan Halifax',r'joan halifax|roshi joan','zen'),
 ('mingyur-rinpoche','Yongey Mingyur Rinpoche',r'mingyur','tibetan'),
 ('dalai-lama','The 14th Dalai Lama',r'dalai lama|his holiness','gelug'),
 ('tsoknyi-rinpoche','Tsoknyi Rinpoche',r'tsoknyi','tibetan'),
 ('pa-auk-sayadaw','Pa-Auk Sayadaw',r'pa-?auk (tawya )?sayadaw','burmese'),
 ('tara-brach','Tara Brach',r'tara brach|tara talks','insight'),
 ('jack-kornfield','Jack Kornfield',r'kornfield','insight'),
 ('gil-fronsdal','Gil Fronsdal',r'fronsdal|\bgil\b','insight'),
 ('joseph-goldstein','Joseph Goldstein',r'joseph goldstein','insight'),
 ('sharon-salzberg','Sharon Salzberg',r'salzberg','insight'),
]
RX=[(i,n,re.compile(r,re.I),t) for i,n,r,t in T]
BY={i:(n,t) for i,n,r,t in T}
T2=[('brad-warner','Brad Warner',r'brad warner','soto-zen'),('henry-shukman','Henry Shukman',r'shukman','zen'),('shinge-roshi','Shinge Roshi',r'shinge','rinzai-zen')]
RX+= [(i,n,re.compile(r,re.I),t) for i,n,r,t in T2]
BY.update({i:(n,t) for i,n,r,t in T2})
