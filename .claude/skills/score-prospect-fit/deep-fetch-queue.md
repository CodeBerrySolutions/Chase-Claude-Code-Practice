# Deep-fetch queue — score-prospect-fit

**Snapshot: 2026-08-26.** The 18 rows left at `status=needs_deep_fetch` after the
harvest + targeted re-fetch. Firecrawl's plain scrape and the in-container browser
are both exhausted for these (Cloudflare/login/JS-SPA walls; org proxy blocks
general egress from the runner). They need the **9222 manual browser pass** on
Phil's machine (real Chrome, no egress limit) — open the URL, grab the rendered
content, write it to the row's `fetched_content`, and flip `status` back to
`to_score` so the scorer picks it up.

**13 to crack** (worth the browser pass) · **5 screen-as-is**
(a deep fetch cannot change the verdict — recommend writing these now, no fetch).

## Crack — open in the 9222 browser

| Pri | Handle | Followers | URL to open | What to resolve |
|---|---|---:|---|---|
| high | @mimjenkinson | 42759 | https://beacons.ai/mimjenkinson | DIY sticker classes for Etsy sellers, '25,000 happy students' — beacons.ai (JS SPA). Look for: paid course/membership + delivery load. Likely FIT. |
| high | @jayaltman | 28008 | http://www.bookme.name/jayaltman | WSJ author, 'Coach Service-Based Business', book-a-consult — bookme.name booking page. Look for: paid program + demand. Likely fit/review. |
| high | @fatima_lifestyleliving | 1154 | https://stan.store/fatima_lifestyleliving | Life/career-transition coach — stan.store (renders paid digital products in-browser). Look for: paid offers + demand. |
| high | @rosemetcalf | 2425 | https://risemasterclasslive.com | 'Make your biz out-earn your 9-5' + RISE — risemasterclasslive.com (Cloudflare). Look for: paid program (RISE) vs free-masterclass funnel + demand. |
| high | @_realestateant | 40234 | http://download.realsync.app/free-ai-app | RE investor, 200+ doors/BRRRR, 40k followers — link is a 'free AI app' download, not an offer. Look for: is there a paid mentorship/course, or is the app the whole product (→ product_only/no). |
| med | @madalyngraceofficial | 7454 | http://www.movementmarketingusa.com/ | Marketing agency owner — movementmarketingusa.com. Decide: teaches marketing (course/coaching) vs done-for-you agency (off-ICP). |
| med | @nervoussystemwithgabriela | 223 | https://beacons.ai/somaticleadership | Somatic 'somaticleadership' — beacons.ai. Look for: paid program + text-serviceable share (somatic work can be experiential, not knowledge-in-words). |
| low | @dwaynekerriganpodcast | 25303 | https://kyle-pease-foundation-inc.networkforgood.com/events/99987-the-dwayne-kerrigan-podcast | Entrepreneur-interview podcast, 25k — link is a charity event page (odd). Look for: any paid coaching offer beyond the podcast, else review/later. |
| low | @anothermillionmilespodcast | 108 | https://open.spotify.com/show/7BUvOX9noYwPEoFnwJhAAw | Mindset podcast for women, 108 followers — Spotify show link. Podcast property; look for a paid offer, else later. |
| low | @elevatetheblueprint | 38 | https://api.leadconnectorhq.com/widget/quiz/9wVffqla2u1L0gvkHfU1 | 'Leadership Audit' quiz funnel (LeadConnector), 38 followers. Look for a paid program behind the quiz; negligible reach → likely later. |
| low | @riseclub9 | 1644 | https://beacons.ai/riseclub9 | Daily-motivation/quotes brand — beacons.ai. Look for any paid method/offer; motivation-content → likely no offer / later. |
| low | @2.0projectyou | 74 | http://beacons.ai/projectyou2.0 | 'Life & discipline guides', 74 followers — beacons.ai. Small mindset content; look for a paid offer, else later. |
| low | @dividend_diary | 90 | http://finveztor.com/ | Personal dividend-portfolio content — finveztor.com. Decide: coaching offer vs a tool/product or pure content (→ later/no). |

## Screen-as-is — recommend scoring now, no fetch

A browser pass is wasted on these (regulated clinical hard stops, off-ICP employee/
personal accounts, or a content account whose only link is a chat DM).

| Handle | Followers | Provisional verdict + why |
|---|---:|---|
| @dralbatish | 15958 | no | Cosmetic/Implant/Invisalign dentist — regulated case-specific clinical service = hard stop (F1). Deep fetch cannot change this. |
| @nasim_mesgarzadeh | 609 | no | DDS/craniofacial surgical orthodontist — regulated clinical hard stop (F1); LinkedIn link is unfetchable anyway. |
| @bradmch | 1254 | no | 'Health/Fitness/Travel/Snowboarding' personal + link to a pet-store IG — off-ICP, no coaching offer. |
| @audacyaudiodenny | 185 | no | 'Senior BD Executive' at Audacy (radio corp), corporate audacy.com — an employee, not a coach — off-ICP. |
| @danixio_motivation_cut_ | 86 | later | Motivation-quotes content, only a WhatsApp (wa.me) link — no offer/method; a wa.me deep-fetch yields nothing. |

## Row keys (for the writer / status flip)

```
CRACK:  3542552246 5671340936 63221414288 251031408 61563849201 221873039 49534188428 60191715932 72078709003 77837771384 43320459143 39643364850 60561282619
SCREEN: 7367838466 1523024085 282306190 37736867411 67814688359
```
