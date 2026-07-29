# Calibration examples (human-labeled)

Ground-truth verdicts from a real review pass, with the reviewer's reasoning.
Use these to calibrate the skill and as a regression set — a rubric change that
would flip one of these needs a good reason.

Verdicts: **High** = qualified, act now · **Low** = fit but lower priority ·
**Cut** = out of ICP. (`~medium` = reviewer flagged as between High and Low.)

## High — sell interactive coaching
| Handle | Why (reviewer) |
|---|---|
| `@elenasblair_photography` | Photographer, but really a **biz coach** for them; has a **mastermind** — strong fit indicator. |
| `@estheriturralde` | Ideal fit. Lots of engagement. Spanish-speaking. |
| `@nancy_levin` | **9-week group coaching** program, life coach. |
| `@kellylynnadams` | Has a **1:1** program. |
| `@theblondecherie` | Does **1:1** coaching. |
| `@maryghyatt` | Does coaching (kinda buried); makes herself available for contact. |
| `@taylor_stanzione` | Has a $600 course; does other stuff too → reviewer would call `~medium`. |
| `@jayaltman` · `@kiki_keysers` · `@mediumcourtneydawson` · `@taradunnconnects` | (fit) |

## Low — fit but deprioritized
| Handle | Why (reviewer) |
|---|---|
| `@tiana_smith_coaching` | Almost no engagement → **unlikely at capacity**, so less likely to need help. |
| `@projectleaderacademy` | Almost no engagement → unlikely at their limit. |
| `@sallyhogshead` | Expertise fits but offering an **agency**, already scaled; likely still gets many DMs. |
| `@barbpitcock` | Bio fits but **no clear offer**; links = ecommerce + linktree w/ broken links. |
| `@grow.with.roshnii` | **Ecommerce + coaching mixed**; unclear focus. |
| `@jenniwedmore` | Offer not clear. |
| `@maryumsharif` | Website down; offer unclear. |
| `@waldorf_essentials` | Expertise a perfect fit, but offer unclear (mostly free/cheap), site very old. |
| `@galontheprowl` | Does 1:1 but lots of other stuff; **offer muddy**. |
| `@chantellespeaks` | Speaking coach → maybe more **presential** than digital. |
| `@postpartumuniversity` | Website flagged as possible phishing → couldn't verify. |

## Cut — out of ICP
| Handle | Why (reviewer) | Exclusion type |
|---|---|---|
| `@theenglishaesthetic` | Doing a **medical procedure**; expert in *performing*, not *providing info*. | procedural |
| `@patriciamedrospilates` | Pilates = **physical training**. | physical |
| `@ashleeyoungmusicstudio` | Teaches reading music — **visual** component. | visual skill |
| `@vickibartel.photographer` | Photographer selling **services**, not expertise. | performed craft |
| `@honeywavecreative` | Has a $97 course but **no sign of interaction** with students. | passive product |
| `@buywomenbuilt` | It's a **community**, not an expert. | community |

## Patterns to encode (already folded into the rubric)
1. **Interactive coaching required** — 1:1 / group / mastermind. Passive product,
   performed craft, procedure, physical/visual skill, or community → Cut.
2. **Coaching-their-peers beats the niche** — `@elenasblair` (photographer who
   coaches photographers) is High; `@vickibartel` (photographer selling photos)
   is Cut.
3. **Capacity signal** — low engagement/traction ⇒ probably not at their limit
   ⇒ Low. Already-scaled/agency ⇒ Low.
4. **Offer clarity** — muddy/mixed/dead-link offers ⇒ Low + `needs_review`, not
   Cut (unless positively out-of-ICP).
