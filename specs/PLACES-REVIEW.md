# Places review: organisations with public safety records (for the owner)

Written 2026-10-25. **Nothing here has been removed or hidden.** These places stay on the map as they are; this file lists
them with the public sources so the owner can decide, place by place, whether to keep, annotate or drop them.
Person-level records already shown to agents (dated, sourced, never a verdict) live in `app/wisegraph/redflags.json`
(published only when a strong primary source exists: institutional statement, investigation, regulator, court).

Rule of thumb for a decision: is the harm (a) about a founder long dead, addressed by the organisation (apology, independent
report, policy), or (b) unaddressed / about people still teaching there? (b) is the stronger case for removal or a visible note.

## A. Places tied to a person with a published red-flag record

| Place id(s) | Organisation | What is on record | Sources |
|---|---|---|---|
| `rigpa-london`, `lerab-ling` | Rigpa (Sogyal Rinpoche, d. 2019) | Independent Lewis Silkin investigation (2018) found serious physical, sexual and emotional abuse of some students and that senior figures knew; UK Charity Commission inquiry | https://www.rigpa.org/posts-rigpa-news/2018/9/5/ipy3htvslzlyj8vqjpuy1h82a43jfv · https://www.gov.uk/government/publications/charity-inquiry-rigpa-fellowship/charity-inquiry-rigpa-fellowship |
| `zcla` | Zen Center of Los Angeles (Taizan Maezumi, d. 1995) | Maezumi admitted alcoholism and sexual relationships with students (1983); White Plum Asanga statement (2017) | https://whiteplum.org/a-statement-of-the-white-plum-asanga-regarding-allegations-of-sexual-misconduct/ · https://tricycle.org/magazine/under-lens-american-zen-community-crisis/ |
| `sivananda-london`, `sivananda-val-morin`, `sivananda-neyyar-dam`, `sivananda-ranch` | International Sivananda Yoga Vedanta Centres (Swami Vishnudevananda, d. 1993) — **added to red flags this round** | Dec 2019 allegations by Julie Salter and others; BBC 2021 spoke to 14 women alleging abuse by senior teachers (two other teachers, one possibly still active in India); board apologised for historic mistakes and commissioned an independent investigation; community-funded Project SATYA interim reports 2020. The Neyyar Dam ashram (Sivananda India) published a statement rejecting the allegations against its founder | https://www.bbc.com/news/world-asia-india-57400014 · http://www.projectsatya.org/Investigation-Interim-Report-3-Project-SATYA.pdf · https://sivananda.org.in/neyyardam/ashram-statement |
| `himalayan-institute` | Himalayan Institute, Honesdale PA (Swami Rama, d. 1996) — **added to red flags this round** | 1997 federal jury verdict (US$275k + US$1.6m punitive) against the Institute: Swami Rama abused his position as guru to have sex with a 19-year-old student; Institute negligent; upheld Dec 1999 | https://case-law.vlex.com/vid/patel-v-himalayan-international-884783725 · https://prem-rawat-bio.org/nrms/info/rama1.htm (Yoga Journal, Dec 1990) |

## B. Places tied to an organisation with public findings, no person record yet (candidates for redflags.json)

| Place id(s) | Organisation | What is on record | Sources |
|---|---|---|---|
| `shambhala-london`, `shambhala-mountain` (now Drala Mountain Center), `karme-choling` | Shambhala International (Sakyong Mipham, living) | Wickwire Holm independent investigation (Feb 2019) found sexual misconduct by the Sakyong in two claims and received ~20 reports about other leaders; An Olive Branch reports (Mar 2019); the Sakyong stepped back, Kalapa Council disbanded. Living subject: our publication rule holds person records about the living | https://code-of-conduct.shambhala.org/reports · https://www.cbc.ca/news/canada/nova-scotia/sexual-misconduct-claims-buddhist-church-1.5004557 · https://tricycle.org/article/shambhala-investigation/ |
| `bihar-school-of-yoga`, `satyananda-yoga-uk` | Satyananda Yoga (Swami Satyananda, d. 2009; Akhandananda) | Australian Royal Commission Case Study 21 (report 2016) on child sexual abuse at the Mangrove Mountain ashram in the 1970s–80s; found Satyananda had overarching authority there | https://www.childabuseroyalcommission.gov.au/case-studies/case-study-21-satyananda-yoga-ashram · https://www.childabuseroyalcommission.gov.au/media-releases/report-satyananda-yoga-ashram-released |
| `adhisthana`, `london-buddhist-centre`, `padmaloka`, `guhyaloka`, `nagaloka`, `buddhist-society-bookshop` (Windhorse) and the ~35 other `triratna` centres | Triratna (Sangharakshita, d. 2018) | Adhisthana Kula report (Aug 2020) and Message of Apology and Regret (2019) acknowledge unethical sexual behaviour by the founder; Observer/Guardian 2019 investigation | https://thebuddhistcentre.com/stories/ethical-issues · https://thebuddhistcentre.com/highlights/message-apology-and-regret · https://www.theguardian.com/world/2019/jul/21/sangharakshita-guru-triratna-buddhist-dark-secrets |
| `kripalu` | Kripalu Center (Amrit Desai, living; left 1994) | Desai resigned in 1994 after admitting sexual relationships with disciples; Kripalu's own timeline records it; federal opinion Dushkin v. Desai (1998). Kripalu has had no tie to Desai since | https://kripalu.org/living-kripalu/moments-made-us-kripalu-timeline · https://law.justia.com/cases/federal/district-courts/FSupp2/18/117/2449890 |
| `gurudev-siddha-peeth`, `shree-muktananda-ashram`, `muktabodha-indological-research-institute` | Siddha Yoga / SYDA (Muktananda, d. 1982) | Allegations of sexual abuse incl. of minors (Rodarmor, CoEvolution Quarterly 1983; Lis Harris, The New Yorker 1994). Press only, no institutional finding; SYDA denies | https://www.newyorker.com/magazine/1994/11/14/o-guru-guru-guru |
| `monte-sahaja` | Mooji / Monte Sahaja (living) | 2019 investigative blog piece by former members alleging coercive control and sexual relations with students; Monte Sahaja published a rebuttal. Single non-institutional source | https://www.gurumag.com/becoming-god-inside-moojis-portugal-cult/ · https://mooji.org/monte-sahaja-response-to-allegations-of-abusive-cult |

## C. Raised by reviewers, not yet sourced this round (research before any decision)
- `manjushri-kmc`, `kmc-london` (New Kadampa Tradition), `diamond-way-london` (Diamond Way / Ole Nydahl), `osho-pune`,
  `amma-uk` + `amma-ma-center`, `isha-institute`, `dhammakaya-london` (Wat Phra Dhammakaya). Public controversies exist for
  each; none was opened and checked this round, so nothing is asserted here.

## Missing input
The discovery round's own review list (`work/wiser-places-discovery/rejects.md`) was not present in the workspace on
2026-10-25, so this list was compiled from the places already on the map plus fresh source checks. When that folder lands,
merge its entries here (keep the source URLs).
