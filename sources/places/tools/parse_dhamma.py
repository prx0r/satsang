#!/usr/bin/env python3
"""Parse dhamma.org directory + maps pages (fetched 2026-10-20) into vipassana-centres.json.
Sources: https://www.dhamma.org/en-US/locations/directory and https://www.dhamma.org/en-US/maps
"""
import json, re, html, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp = open(f'{HERE}/raw/dhamma-maps.html').read()
dr = open(f'{HERE}/raw/dhamma-directory.html').read()

def grab(var):
    i = mp.find(var + ' = ') + len(var) + 3
    dec = json.JSONDecoder()
    obj, _ = dec.raw_decode(mp[i:])
    return obj

pos = grab('position_data')
loc = grab('location_data')

# directory blocks
dirinfo = {}
for m in re.finditer(r'<div id="location-(\d+)" data-id="\d+" data-subdomain="([^"]*)"[^>]*data-name="([^"]*)" data-country-iso-code="([A-Z]*)"', dr):
    lid, sub, name, iso = m.groups()
    j = dr.find('<a class="location-anchor"', m.end())
    blk = dr[m.end(): j if j > 0 else m.end() + 20000]
    city = re.search(r'<span class="display-name">([^<]*)</span>', blk)
    dn = re.search(r'<span class="dhamma-name">([^<]*)</span>', blk)
    site = re.search(r'glyphicon-home"></i> <a href="([^"]+)"', blk)
    sched = re.search(r'href="(/en[^"]*/schedules/[^"]+)"', blk)
    det = re.search(r'data-location-details="([^"]*)"', blk)
    first = None
    if det:
        t = html.unescape(html.unescape(det.group(1)))
        fm = re.search(r'First Course:\s*(?:[^<]*?)(\d{4})', t)
        first = int(fm.group(1)) if fm else None
    dirinfo[sub] = dict(dir_id=lid, name=html.unescape(name), iso=iso,
                        city=html.unescape(city.group(1)).strip() if city else None,
                        dhamma_name=html.unescape(dn.group(1)).strip() if dn else None,
                        website=site.group(1) if site else None,
                        schedule=('https://www.dhamma.org' + sched.group(1)) if sched else None,
                        first_course=first)

out = []
for sub, L in loc.items():
    if not isinstance(L, dict) or 'title' not in L:
        continue
    p = pos.get(sub, {})
    d = dirinfo.get(sub, {})
    desc = L.get('description', '')
    iso = d.get('iso')
    if not iso:
        f = re.search(r"flag-([a-z]{2})'", desc)
        iso = f.group(1).upper() if f else None
    try:
        lat, lng = float(p.get('latitude')), float(p.get('longitude'))
    except (TypeError, ValueError):
        lat = lng = None
    out.append(dict(
        id='dhamma-' + re.sub(r'[^a-z0-9]+', '-', sub.lower()).strip('-'),
        subdomain=sub,
        name=html.unescape(L['title']),
        full_name=d.get('name'),
        type='retreat-centre' if L.get('iscenter') else 'non-centre-site',
        is_center=bool(L.get('iscenter')),
        traditions=['goenka-vipassana'],
        country=iso,
        city=d.get('city'),
        lat=lat, lng=lng,
        coord_source='dhamma.org/en-US/maps position_data',
        founded=d.get('first_course'),
        founded_note='year of first course per dhamma.org' if d.get('first_course') else None,
        teacher_ids=['goenka'],
        url=d.get('website') or (f'https://{sub}.dhamma.org' if '.' not in sub else None),
        schedule_url=d.get('schedule') or f'https://www.dhamma.org/en-US/schedules/sch{sub}',
        offers=['residential retreats', '10-day courses'],
        cost_model='dana (no charge; donations from old students only)',
        in_directory=bool(d),
    ))
out.sort(key=lambda r: (r['country'] or 'ZZ', r['name']))
json.dump({'_note': 'S. N. Goenka Vipassana centres and non-centre course sites parsed from dhamma.org directory + maps (2026-10-20). Coordinates are those published by dhamma.org on its map. founded = first course year where stated.', 'centres': out},
          open(f'{HERE}/vipassana-centres.json', 'w'), indent=1, ensure_ascii=False)
c = sum(r['is_center'] for r in out)
print(len(out), 'locations;', c, 'centres;', len(dirinfo), 'in directory;', sum(r['lat'] is None for r in out), 'no coords')
print(len({r['country'] for r in out}), 'countries')
