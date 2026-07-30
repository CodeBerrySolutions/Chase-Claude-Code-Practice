---
name: draft-outreach
description: Drafts a first-touch outreach message (DM or email) from Phil, founder of Berry Nova, to a qualified coach prospect, asking for a short research conversation about how the coach runs their operation. Use when the user asks to write outreach, a first-touch message, a cold DM or email, or a message to a coach/prospect — especially after score-prospect-fit has classified the prospect's door (overloaded or acquisition-mode).
---

# Draft Outreach

Draft a first-touch message running the "research-call motion": Phil (founder, Berry Nova — an AI operator platform for coaches) personally asks a qualified coach prospect for a short conversation to learn how they run their operation. Berry Nova has no public case studies, no audience, and no authority yet. The message must work without any of those.

## Inputs

Expect from the user (or prior skill output):

1. **Prospect profile** — who the coach is, what they do, and at least one SPECIFIC, TRUE detail from their actual profile or content (a post, a program, a bio line, a number they stated).
2. **Door classification** from score-prospect-fit: `overloaded` or `acquisition-mode`.
3. **Optional: past messages Phil actually sent** — treat as voice reference and match their tone, sentence length, and greeting/sign-off style.

If the profile contains no specific detail to reference, STOP and ask for one (or flag the gap and deliver the draft with an explicit `[NEEDS SPECIFIC: ...]` placeholder). Never invent specifics.

## Hard rules

- NEVER fabricate social proof, case studies, client counts, credentials, or results. No "we've helped dozens of coaches." Write nothing that cashes a credibility check Berry Nova can't cover.
- Sound like a founder reaching out personally, not a marketer. Plain language. No buzzwords, no "I hope this finds you well," no exclamation-point enthusiasm.
- Keep DMs under ~120 words. Emails only slightly longer, with a short plain subject line.
- Make exactly ONE ask: a short call/conversation. No pitch deck, no feature list, no pricing, no link dump, no "or just reply with X" secondary asks.
- Frame the call as research/learning — Phil wants to understand their operation. It is not a sales call and must not read like one.
- Reference the specific true detail from the prospect's profile early, and make it do work (show you actually read their stuff), not as a flattery token.
- Be honest about who Phil is: a founder building something for coaches, early, learning. Honesty about being early is the credibility play.

## Door-based framing

Choose the angle from the door classification:

### overloaded (drowning in clients)

- Angle: their time/capacity pain. Express genuine curiosity about how they're handling delivery at capacity — check-ins, client tracking, admin, the stuff between sessions.
- Implicit promise: relief for their EXISTING operations. Do not state it as a promise; let the topic of the conversation imply it.
- Good curiosity hooks: "how do you keep up with X clients," "what does a week of client management look like," "where does the time actually go."

### acquisition-mode (scaling toward ceiling)

- Angle: how they're preparing operations to scale before the ceiling hits. Curiosity about what breaks first as client count grows.
- Do NOT promise or imply lead generation — the product does not do that. Never hint at "getting you more clients."
- Good curiosity hooks: "what has to change operationally to go from N to 2N clients," "what you'd have to systematize before growing."

## Drafting steps

1. Confirm you have a specific true detail and a door. Handle gaps per Inputs above.
2. Pick the angle from the door. Write 3-5 candidate opening lines that lead with the specific detail; keep the best.
3. Draft the body: opener referencing the detail → one sentence of who Phil is and why he's reaching out (building for coaches, early, learning from people actually doing the work) → the single ask (15-20 minutes, their convenience).
4. Cut ruthlessly. Every sentence must earn its place. Target 60-100 words for a DM.
5. Self-check against every hard rule. If any claim implies traction, authority, or results, delete it.
6. If voice reference messages were provided, revise the draft to match that voice.

## Output format

Return exactly:

```
MESSAGE: <the draft>
ANGLE: <one line on the angle chosen and why it matches the door>
VARIANTS: <optionally 1 alternative opening line>
```

## Examples

### Example 1 — overloaded door, DM

Input: Maya, strength coach, Instagram post last week saying she's "at 34 clients and my check-in days are 10 hours of spreadsheets."

```
MESSAGE: Hey Maya — saw your post about check-in days turning into 10 hours of spreadsheets at 34 clients. That line stuck with me.

I'm Phil. I'm building Berry Nova, an AI operator platform for coaches — early stage, and right now I'm mostly trying to learn from coaches running full rosters before I build the wrong thing.

Would you be open to a 15-minute call sometime this week? Just want to understand how you actually handle delivery at capacity. No pitch — I don't have one yet.

ANGLE: Overloaded door — led with her stated check-in pain and framed the call as research into how she handles delivery at capacity; implicit relief for existing operations, nothing promised.

VARIANTS: "34 clients and 10-hour check-in days — that post of yours has been rattling around my head all week."
```

### Example 2 — acquisition-mode door, DM

Input: Devon, online nutrition coach, recent podcast episode where he said he wants to grow from 20 to 60 clients this year without hiring.

```
MESSAGE: Hey Devon — listened to your podcast episode where you talked about going from 20 to 60 clients this year without hiring. Curious how you're thinking about that.

I'm Phil, founder of Berry Nova — an AI operator platform for coaches. We're early, and I'm talking to coaches who are scaling to understand what breaks operationally on the way up.

Any chance you'd do a 15-minute call? I want to learn how you're preparing the delivery side for 3x the clients. Purely research on my end.

ANGLE: Acquisition-mode door — anchored on his stated 20-to-60 goal and framed the call as research into scaling operations; no hint of lead generation, only the operational side of growth.

VARIANTS: "Going 20 to 60 clients with no hires is a bold operational bet — your podcast episode got me thinking."
```
