# LM Summer Camp OS — PRD

**Owner:** Skylor
**Cohort 1 (S26):** July 20 – August 31, 2026
**Build constraint:** solo, nights/weekends
**Budget:** $500 one-time setup + $2,500/yr ongoing (includes existing Claude + G Suite)
**Decision:** Ship S26 on **Path A (stitched no-code)**. Migrate to **Path C (custom Next.js)** for S27.

---

## 1. Why this exists

The landing page (`index.html`, `about.html`, `demos.html`, `faq.html`) sells the program. The OS is what campers actually log into for six weeks. Without it, accepted campers have nowhere to go after their welcome email — and the weekly update ritual (the single thing that makes a 6-week cohort work) has no home.

The reference, buildspace's [`buildspace-os`](https://github.com/buildspace/buildspace-os), is a 12-line Chrome extension that iframes `buildspace.so/home`. The real product is the hosted dashboard. We've replicated the extension pattern for LM (see [`/extension`](extension/)) and need to build the page it points at: `learningmachines.xyz/os`.

## 2. What the OS does (cohort 1)

Five surfaces, each handled by an existing SaaS tool we glue together. **No custom backend in S26.** **No auth gating on `/os`** — like buildspace, the page is public. Campers bookmark it (or use the Chrome extension).

| Surface | Tool | What it does |
|---|---|---|
| Application + acceptance | **Fillout** | Public form embedded on `/apply` (wired to existing `data-apply-link` slots). Decisions handled from Fillout's submissions table — for S26, accept basically everyone (see §3). |
| Camper DB + admin | **Google Sheets** | Source of truth: name, email, idea, weekly update completion 1–6, demo day project. Auto-synced from Fillout. Already paid for via existing G Suite. |
| Community + chat | **Discord** | One server, channels per week (`#week-1-idea`, `#week-2-build`, …), plus `#wins`, `#help`, `#feedback`, `#demo-day`. Linked from `/os`. All announcements + weekly update shoutouts post here. |
| Lectures + talks | **YouTube (public)** | Lectures can be livestreamed *or* pre-recorded, published publicly on the LM YouTube channel. Embedded on `/os` once live. Guest talks recorded via Riverside.fm or Zoom, uploaded same day. |
| The OS page (`/os`) | **Static HTML on Vercel**, public | Hub. Shows current week, embeds this week's lecture + talk, links to Discord, opens the weekly update form. Built into the existing repo as `os.html`. |
| Weekly update form | **Fillout** (a second form) | One submission per camper per week. Fields: what I built, what I learned, what I need, link to progress. Pipes into Sheets. |
| Demo gallery | **Existing [demos.html](demos.html)** | Manually populated from Sheets at end of camp. |
| New-tab launcher | **Chrome extension** ([`/extension`](extension/)) | Optional. Replaces new tab with `/os`. Already built. |

### The weekly ritual

Every camper, every week:

1. **Monday 9am ET** — week's lecture goes live (livestream or pre-recorded drop). Post in `#announcements` on Discord with the YouTube link. `os.html` is updated to embed the new video.
2. **Wednesday 7pm ET** — live guest talk on Riverside or Zoom, streamed into Discord stage or shared as a watch-along. Recording uploaded same day to YouTube and posted in Discord.
3. **Sunday 11:59pm ET** — weekly update due via Fillout form. Linked from `/os` and from a pinned message in `#weekly-updates`.
4. **Monday morning** — top 2–3 updates of the week get shoutouts in Discord `#wins` and on `/os`'s sidebar.

**No email blasts.** Announcements live on Discord + the `/os` page only. (Email is reserved for application decisions and visa-related comms.)

The Sheets file (one tab: "Campers") tracks who submitted each week. Filter view "Missed last week" surfaces inactive campers — by Friday, anyone with no W-N submission gets a personal DM on Discord.

**Sheet schema (one row per camper):**

```
| Timestamp | Name | Email | Idea | Why now | Twitter | Status | W1 | W2 | W3 | W4 | W5 | W6 | Demo Day? | Notes |
```

- `Status` — data validation dropdown: `pending` / `accepted` / `rejected`
- `W1..W6` — drop the Fillout-submitted update link here (auto-pulled via Fillout integration or via a second form-response tab + VLOOKUP). Conditional formatting: green when filled.
- `Demo Day?` — `yes` / `no` / `invited`

Fillout has a native Google Sheets integration — set it up so the application form writes to a "Applications (raw)" tab, then use a VLOOKUP or QUERY formula to mirror into the "Campers" tab as you accept people. Or, simpler for v1, just copy-paste accepted rows manually each Sunday.

## 3. Admissions stance for S26

**Default: accept everyone who applies and shows real intent.** Reasoning:

- Buildspace's open-door model worked. The cohort sorts itself by who actually ships weekly updates.
- With an expected ~100 campers (cap 1,000), we have room.
- The hyper-competitive layer is the **in-person Toronto demo day invite**, awarded to campers who ship the full 6 weekly updates *and* have a strong project. That's where we get to be picky without gatekeeping at the front door.

**Application form fields (keep short — ≤4 questions):**
- Name + email
- What are you going to build this summer? (1–2 sentences)
- Why this idea, why now? (3–5 sentences)
- Optional: link (Twitter, GitHub, personal site, etc.)

**Auto-reject filters** (Fillout logic):
- Spam / blank submissions
- Obvious troll responses
- People who explicitly say they have <5 hrs/week (we ask for 10+)

Everything else → accept. Acceptance email goes out within 48 hours.

## 4. The OS page (`/os`)

This is the *one* piece we build ourselves in S26. Public URL, no login.

**Tech:** new file `os.html` in the existing repo, same Vercel deployment, same `styles.css` tokens as the landing site.

**What it shows (top to bottom):**

- Hero strip: "Week N of 6 — [theme]" with countdown to next due date (`script.js` already has a time indicator pattern; extend it).
- Embedded YouTube player: this week's lecture.
- Embedded YouTube player: this week's guest talk (or "Wednesday 7pm ET — RSVP" if it hasn't happened yet).
- Big button: **Submit this week's update** → opens the Fillout form in a new tab.
- Button: **Open Discord** → deep-links into the LM server.
- Side panel: 2–3 highlighted weekly updates from last week (manually curated, updated each Monday).
- Below the fold: past weeks (each collapsible — week N, lecture, talk, top updates), resources (recommended tools, AI prompts, mentor office hours calendar).

**Editing model:** content is hand-coded in `os.html` each Monday. No CMS. Total editing time: ~10 min/week. The page is small enough that this is faster than wiring up Sanity/Contentful/Notion-as-CMS.

If editing weekly HTML becomes painful by week 3, the upgrade path is a single `week-data.json` file that `os.html` reads at build time — but don't pre-optimize.

## 5. `/u/[handle]` — what this is

You asked what `/u/[handle]` means. It's a public profile page for each camper, with the handle baked into the URL. The pattern is everywhere:

| Example | URL |
|---|---|
| Twitter / X | [`twitter.com/elonmusk`](https://twitter.com/elonmusk) |
| GitHub | [`github.com/torvalds`](https://github.com/torvalds) |
| Product Hunt | [`producthunt.com/@rrhoover`](https://www.producthunt.com/@rrhoover) |
| Buildspace (the buildspace.so equivalent) | `buildspace.so/@username` |

For LM, it would be `learningmachines.xyz/u/skylor` or `learningmachines.xyz/@skylor`, showing:

- Camper photo + name + cohort badge ("S26 Alum")
- One-line bio + the idea they built this summer
- Their 6 weekly updates, scrollable
- Embedded demo video
- Links (Twitter, GitHub, personal site)
- "Connect" CTA (Twitter DM, email)

**Visual rough sketch:**

```
┌──────────────────────────────────────────────────────────┐
│  [photo]   Skylor Smith                          S26 Alum│
│            Building an AI tutor for high schoolers.      │
│            [twitter] [github] [website]                  │
├──────────────────────────────────────────────────────────┤
│  Demo                                                    │
│  [▶ embedded video]                                      │
├──────────────────────────────────────────────────────────┤
│  Weekly updates                                          │
│  ┌─ Week 1 ───────────────────────────────────────────┐  │
│  │ Picked the idea. Talked to 5 high schoolers. They  │  │
│  │ all said the same thing about homework hell.       │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌─ Week 2 ───────────────────────────────────────────┐  │
│  │ Built v0 in a weekend. Cursor + Claude + Supabase. │  │
│  │ [link to demo]                                     │  │
│  └────────────────────────────────────────────────────┘  │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

**For S26 (Path A): skip this.** Profiles aren't needed for the program to work. The Discord profile + a public demo on `demos.html` is enough. Build it in S27.

**If you want a cheap version in S26:** generate a static `/alumni/skylor.html` for each accepted camper at the end of camp, populated from Sheets (export to CSV, run a small templating script). A one-time script, not a live system. Could be a fun project for the final week.

## 6. Admin workflow (you, weekly)

A repeatable Sunday-night → Monday-morning loop:

1. **Sunday night:** review the week's submitted updates in Sheets. Tag 2–3 to highlight.
2. **Sunday night:** if pre-recording, finalize next week's lecture. Upload to YouTube as public, scheduled for Monday 9am.
3. **Monday morning:** update `os.html` — bump week number, swap lecture video ID, swap talk placeholder, paste in the curated update highlights.
4. **Monday morning:** post the announcement in Discord `#announcements` (lecture link + this week's talk RSVP + shoutouts).
5. **Wednesday 7pm ET:** run the guest talk. Riverside.fm or Zoom, share to Discord stage. Upload recording same day.
6. **Friday:** scan Sheets ("Missed last week" filter view) for inactive campers (no update last week, no Discord activity). DM them personally.

Once you've done this twice, it's ~3 hours/week of program ops.

## 7. What we explicitly do NOT build for S26

- Custom auth / accounts / database
- Email blasts (Discord + `/os` only)
- Custom video player or progress tracking
- In-app commenting / reactions (Discord does this)
- Public profile pages `/u/[handle]`
- Mobile app
- Demo day voting/judging (Tally form, or in-person hands)

## 8. Timeline (today → July 20)

| When | Milestone |
|---|---|
| **May (now)** | Finalize landing copy. Set up Fillout application form. Wire `data-apply-link` slots. Open applications. |
| **June 1** | Sheets schema set up. Fillout → Sheets sync working. Discord server live with channel structure (private until accepted campers join). |
| **June 15** | `os.html` built and deployed. Chrome extension tested by you and 2 friends. Pre-record week 1 + week 2 lectures. |
| **July 1** | First acceptance emails go out. Discord invites included. 5-min Loom walkthrough of how the OS works. |
| **July 13** | Cohort locked. Final dry run of weekly update form. |
| **July 20** | Launch. Week 1 begins. |
| **Aug 31** | Demo day. Manually populate `demos.html`. |
| **September** | Retro. Survey campers on what was painful. Scope S27 from there. |

## 9. Cost (S26, real numbers)

**One-time setup (budget: $500):**

| Item | Cost |
|---|---|
| Domain `learningmachines.xyz` (already owned) | $0 |
| Chrome Web Store publishing fee (one-time, if/when we publish) | $5 |
| Logo/asset polish (optional Fiverr/contractor) | up to $200 |
| Discord boost level 1 (optional, for vanity URL) | $50 (3 months) |
| Misc design tools (Figma free tier OK) | $0 |
| **Allocated** | ~$255, **leaves ~$245 buffer** |

**Ongoing (budget: $2,500/yr):**

| Tool | Plan | Monthly | Yearly |
|---|---|---|---|
| Vercel | Pro (analytics, bandwidth headroom) | $20 | $240 |
| Fillout | Pro (more submissions, conditional logic) | $20 | $240 |
| Google Sheets | Included in existing G Suite | $0 | $0 |
| Riverside.fm | Standard (HD recording for guest talks) | $15 | $180 |
| Loom | Business (long-form screen recording) | $15 | $180 |
| Mailchimp | Essentials (for accept/reject emails only, low volume) | $13 | $156 |
| Discord Nitro | (optional, for server boosts) | $10 | $120 |
| **Claude Pro/Max** (existing) | — | $20–100 | $240–1,200 |
| **G Suite Business Standard** (existing, 1 user) | — | $14 | $168 |
| **Total** | | | **~$1,640 (with Claude Pro) / ~$2,600 (with Claude Max)** |

**Decision points:**
- If you're on Claude Max ($100/mo), you're at the edge of the $2,500 budget. Drop Loom or Discord Nitro if needed.
- Skip Mailchimp if you'd rather send accept/reject emails via Gmail manually (saves $156/yr; fine for ~100 campers).
- Defer Vercel Pro until/unless free-tier limits get hit (saves $240/yr).
- Minimum viable stack: Fillout free + Google Sheets (G Suite) + Vercel free + Discord free + YouTube + Gmail = **~$180/yr** (only Riverside is hard to skip if you want decent recordings).

## 10. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Weekly update completion drops off after week 2 | Public shoutouts on `/os` + Discord. Friday DM nudges. Discord role for 6/6 finishers. |
| Discord goes quiet | Pre-seed each weekly channel with a question. Recruit 3–5 alumni/mentors to be active. |
| You burn out on weekly ops | Pre-record 2–3 lectures before camp starts. Sunday checklist. Recruit one TA by week 2. |
| Application volume too high to review | With the "accept basically everyone" stance + Fillout auto-filters, review is ~10 min/day. |
| Livestream tech fails | Default to pre-recorded + uploaded ahead. Livestream is a stretch goal, not a requirement. |
| Public `/os` gets brigaded / abused | Worst case it's a static page; nothing to vandalize. Update form is gated by Fillout (one submission per email). |

## 11. Path C — what S27 looks like (post-retro)

If S26 works and there's a clear case for a real product, S27 gets a custom build:

**Stack:** Next.js (App Router) on Vercel, Supabase (auth + Postgres + storage), Mux for video, Resend for transactional email, Tailwind matching existing `styles.css` tokens.

**New capabilities a custom build unlocks** (priority order):
1. In-app weekly update feed — scroll everyone's updates, react, comment
2. Streaks + leaderboards as first-class UI
3. Public `/u/[handle]` profiles (the one from §5)
4. Demo day voting/judging inside the app
5. Mentor matching (mentors browse campers by tag, request intros)
6. Chrome extension pointed at the new logged-in home (already shipped; just swap the iframe target if/when the URL changes)

**Data model** (7 tables): `users`, `cohorts`, `weeks`, `updates`, `reactions`, `applications`, `projects`.

**Migration:** export Sheets to CSV, import into Supabase. Discord stays as the chat layer indefinitely.

## 12. Open questions still to resolve

- [ ] Who hosts the guest talks alongside you, if anyone? (Co-hosting takes pressure off and lets talks happen even when you're traveling.)
- [ ] Travel grant pool for the Toronto demo day — fixed amount, or case-by-case? (Already mentioned on `faq.html`, but no budget allocated yet.)
- [ ] Do we want a closed Discord (invite only after acceptance) or a layered one (public lounge + private cohort channels)? (Public might help with marketing and applications next year.)
- [ ] Should the extension publish to the Chrome Web Store before July 20, or stay as a Developer-mode install? (Web Store removes friction but takes ~1 week to clear review.)

---

**Bottom line:** ship S26 on Path A with ~10 hours of setup + ~3 hours/week of ops. All comms on Discord + `/os`. No auth, no email blasts. Use what you learn to scope a real product for S27.
