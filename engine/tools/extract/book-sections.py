# Pass 0 for a single-page HTML book (DLS WordPress reprints): pin the page, cut the book body out of the WordPress chrome,
# normalise to text and split it into sections on the book's own headings. Deterministic, stdlib only.
#
# usage: python3 tools/extract/book-sections.py <page.html> <private-out-dir> <public sections.json> [--url URL]
#
# Writes (private, never the public repo): <out>/book.txt, <out>/sections/<id>.txt
# Writes (public): sections.json (ids, headings, parts, anchors, counts, hashes; no text)
# Normalisation "satsang-book-html/1":
#   body = the HTML between <div class="post-content"> and the first </article> after it (WordPress chrome and the
#   per-request Akismet nonce fall outside, so the body hash is stable across fetches although the page hash is not);
#   h1/h2/h3 start sections (h4 and deeper stay in the body); p, div, li, td, th, tr, pre, blockquote, hr, ul, ol, table
#   are paragraph boundaries; <br> becomes a space (as lib.mjs htmlToText); entities decoded; whitespace collapsed;
#   NFC; paragraphs joined by a blank line. A section's text excludes its own heading.
import hashlib, html, json, re, sys, unicodedata
from html.parser import HTMLParser

BLOCK = {'p', 'div', 'li', 'td', 'th', 'tr', 'pre', 'blockquote', 'hr', 'ul', 'ol', 'table', 'tbody', 'center'}
HEAD = {'h1', 'h2', 'h3'}

def norm(s):
    return unicodedata.normalize('NFC', re.sub(r'\s+', ' ', s).strip())

class Book(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.events = []          # ('head', level, text, anchor) | ('para', text)
        self.buf = []; self.inhead = None; self.hbuf = []; self.anchor = None
    def flush(self):
        t = norm(''.join(self.buf)); self.buf = []
        if t: self.events.append(('para', t))
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'a' and a.get('name'): self.anchor = a['name'].lstrip('#')
        if tag in ('script', 'style'): self.skip = True
        if tag in HEAD: self.flush(); self.inhead = tag; self.hbuf = []
        elif tag in BLOCK: self.flush()
        elif tag == 'br': (self.hbuf if self.inhead else self.buf).append(' ')
    def handle_endtag(self, tag):
        if tag in HEAD and self.inhead:
            t = norm(''.join(self.hbuf)); self.inhead = None
            if t: self.events.append(('head', int(tag[1]), t, self.anchor)); self.anchor = None
        elif tag in BLOCK: self.flush()
    def handle_data(self, d):
        (self.hbuf if self.inhead else self.buf).append(d)
    def close(self):
        super().close(); self.flush()

def slug(s, n=40):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'^\d+\.\s*', '', s); s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s[:n].rstrip('-') or 'untitled'

# Parts, keyed by the heading that opens them (the book's own h2s plus three boundaries the HTML does not mark:
# the opening essays after the prayer, the appendix articles after the Upanishad's last verse, and the glossary).
PARTS = [
    ('Kundalini Yoga', 'front-matter'), ('EXPERIENCES ON AWAKENING OF KUNDALINI', 'opening-essays'),
    ('PRELIMINARY', 'preliminary'), ('KUNDALINI YOGA–THEORY', 'kundalini-theory'), ('YOGA SADHANA', 'yoga-sadhana'),
    ('PRANAYAMA', 'pranayama'), ('ASANAS', 'asanas'), ('MUDRAS AND BANDHAS', 'mudras-bandhas'),
    ('MISCELLANEOUS EXERCISES', 'miscellaneous'), ('YOGA ADDENDA', 'addenda'), ('YOGA-KUNDALINI UPANISHAD', 'upanishad'),
    ('Kundalini Yoga#2', 'appendix-articles'), ('GLOSSARY', 'glossary'),
]
PART_LABEL = {'front-matter': 'Front matter (title page, note, stotras, preface, prayer)', 'opening-essays': 'Opening essays (before Preliminary)',
    'preliminary': 'Preliminary', 'kundalini-theory': 'Kundalini Yoga – Theory', 'yoga-sadhana': 'Yoga Sadhana (Shat-karmas)',
    'pranayama': 'Pranayama', 'asanas': 'Asanas', 'mudras-bandhas': 'Mudras and Bandhas', 'miscellaneous': 'Miscellaneous Exercises',
    'addenda': 'Yoga Addenda', 'upanishad': 'Yoga-Kundalini Upanishad', 'appendix-articles': 'Appendix articles and poems (after the Upanishad)',
    'glossary': 'Glossary'}

def main():
    src, outdir, public = sys.argv[1:4]
    url = sys.argv[sys.argv.index('--url') + 1] if '--url' in sys.argv else ''
    raw = open(src, encoding='utf-8', newline='').read()  # newline='' keeps CRLF so page_sha256 == sha256 of the file bytes
    i = raw.index('<div class="post-content">'); j = raw.index('</article>', i)
    body = raw[i:j]
    p = Book(); p.feed(body); p.close()
    # sections
    secs = []; cur = None; part = None; seen = {}
    def start(level, head, anchor):
        nonlocal cur, part
        key = head
        seen[key] = seen.get(key, 0) + 1
        k2 = key if seen[key] == 1 else f'{key}#{seen[key]}'
        for h, pid in PARTS:
            if h == k2: part = pid
        cur = {'heading': head, 'level': level, 'anchor': anchor, 'part': part, 'paras': []}
        secs.append(cur)
    for e in p.events:
        if e[0] == 'head':
            # the title page's two h3 lines (author, publisher) stay inside the title-page section
            if cur is not None and cur['part'] == 'front-matter' and len(secs) == 1 and e[1] == 3:
                cur['paras'].append(e[2]); continue
            start(e[1], e[2], e[3])
        else:
            if cur is None: start(1, 'Kundalini Yoga', None)
            cur['paras'].append(e[1])
    # empty headings (part titles with no text of their own) are not sections; they remain as part labels
    out = []; full = []
    for s in secs:
        text = '\n\n'.join(s['paras'])
        if not text: continue
        n = len(out) + 1
        heading = s['heading'] if n > 1 else 'Title page'
        sid = f's{n:03d}-{slug(heading)}'
        import os
        os.makedirs(f'{outdir}/sections', exist_ok=True)
        open(f'{outdir}/sections/{sid}.txt', 'w', encoding='utf-8').write(text)
        full.append(f'## {heading}\n\n{text}')
        out.append({'id': sid, 'ordinal': n, 'heading': heading, 'level': s['level'], 'part': s['part'],
                    'anchor': s['anchor'], 'url': f'{url}#{s["anchor"]}' if (url and s['anchor']) else url,
                    'paragraphs': len(s['paras']), 'words': len(text.split()), 'chars': len(text),
                    'sha256': hashlib.sha256(text.encode('utf-8')).hexdigest(), 'file': f'sections/{sid}.txt'})
    book = '\n\n'.join(full) + '\n'
    open(f'{outdir}/book.txt', 'w', encoding='utf-8').write(book)
    parts = []
    for _, pid in PARTS:
        ss = [s for s in out if s['part'] == pid]
        parts.append({'id': pid, 'label': PART_LABEL[pid], 'sections': len(ss), 'words': sum(s['words'] for s in ss),
                      'first': ss[0]['id'] if ss else None, 'last': ss[-1]['id'] if ss else None})
    res = {'type': 'book_sections', 'schema_version': 1, 'source': 'sivananda-kundalini-yoga', 'normalisation': 'satsang-book-html/1',
           'page_sha256': hashlib.sha256(raw.encode('utf-8')).hexdigest(),
           'body_html_sha256': hashlib.sha256(body.encode('utf-8')).hexdigest(),
           'book_text_sha256': hashlib.sha256(book.encode('utf-8')).hexdigest(),
           'totals': {'sections': len(out), 'words': sum(s['words'] for s in out), 'chars': sum(s['chars'] for s in out)},
           'parts': parts, 'sections': out}
    json.dump(res, open(public, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(public, 'a').write('\n')
    print(len(out), 'sections', res['totals']['words'], 'words', {p['id']: p['sections'] for p in parts})

if __name__ == '__main__':
    main()
