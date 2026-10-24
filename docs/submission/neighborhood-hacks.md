# Neighborhood Hacks submission draft

Prepared October 23, 2026 from the creator's description and implemented behavior. Add the final contributor names, public repository URL and uploaded video URL before submitting. No submission has been sent.

## Verified event requirements

Official sources: [event site](https://neighborhoodhacks.org/), [Devpost rules](https://neighborhood-hacks-2026.devpost.com/rules), [schedule](https://neighborhood-hacks-2026.devpost.com/details/dates), [FAQ](https://neighborhoodhacks.org/faq/). Reviewed October 23, 2026.

The schedule closes October 24 at midnight CDT, **1:00 a.m. Eastern on October 24**. Rule prose instead says October 23, 11:59 p.m. CST; use the earlier schedule cutoff. Entrants must be high-school students/equivalent aged 13–21. Teams may have 1–5 members. Code/design/content must be created during the October 16–23 event; prior planning is allowed. Open-source, API and AI assistance must be disclosed. Submit a name, short pitch, written problem/solution/build/challenges/next-steps description, required 2–6 minute working demo, and public code repository. The problem explanation must include actual personal observations, conversations or data. Check the live submission form for final requirements.

## Project name

QuietSpace

## Elevator pitch

Find a public place that feels right for your senses. QuietSpace brings together source-reviewed venues, private sensory preferences and moderated community observations, so choosing somewhere to spend time takes less guesswork.

## What is the specific problem, and how do you know it is real?

I noticed friends struggling to find public places that suited their attention and sensory needs. There was no single place to compare the details that mattered to them, so choosing a library or another place to spend time required substantial research. Arriving somewhere distracting meant losing both that research time and the time spent going there.

QuietSpace starts with this experience: people need different surroundings, and basic venue listings rarely organize information around those differences. Our initial Boston library directory is a concrete starting point. It is not evidence of a Boston user study, and we have not claimed interviews, clinical outcomes or measured community impact.

## What it does

Visitors choose optional noise, crowd, brightness and scent preferences in their browser. A one-click quiet-study shortcut highlights officially documented study spaces **even with zero sensory observations**—without claiming the buildings are currently quiet or inventing numeric scores. They browse five real, source-reviewed Boston Public Library locations, search by name or area, and require verified facilities. Each venue shows source dates, facility evidence, unknowns and any approved sensory observations.

Compatibility scores appear only when there is enough recent evidence. A high fit is separate from evidence strength and never promises live conditions. Historical patterns use the venue's local time and remain unknown when there are fewer than three observations in a period.

Visitors can contribute structured observations on connected reporting deployments. The Community hub displays honest venue and approved observation totals, shows locations needing check-ins, and provides public GitHub issue templates for proposing additional public venues and product improvements. Each venue can show up to six structured approved sensory reviews, rather than fabricated comments or star ratings. Reports persist pending in PostgreSQL, are checked against the same rating/time rules on the server and database, and stay hidden until a trusted operator approves them. Preferences are private; no names, accounts, diagnosis, free-text comments or device location are required.

## How it was built

Next.js App Router, React, strict TypeScript, self-hosted Manrope and Newsreader, and custom CSS. PostgreSQL stores venues, sourced facilities, moderated reports and short-lived abuse controls. Anonymous-role read transactions enforce RLS; pending-only RPCs and persistent atomic limits protect writes. A Supabase REST adapter is also available. Native Node tests, Python data checks, Playwright, axe and real PostgreSQL suites provide reproducible evidence.

The design is an editorial neighborhood guide: warm paper, restrained rust accents, a custom arch mark, real public-domain library photography, and a list organized for comparison. It avoids decorative dashboards, fake activity, fabricated statistics and generic feature-card repetition.

## Challenges and decisions

- Sparse evidence must stay sparse. The real venue records contain no invented observations; synthetic reporting demonstrations use a separate, clearly labeled test database.
- A library building is not automatically quiet. Officially listed study spaces can help visitors choose where to investigate while real noise remains unknown. A source-confirmed entrance is narrower than verified whole-building accessibility. Unknowns fail a strict required-facility filter.
- A fit heuristic and the strength of its evidence answer different questions, so they are labeled separately.
- Safe public contribution needs more than a form. We tested pending visibility, operator approval/rejection, RLS, duplicate/rapid/concurrent requests and time-bounded cleanup against actual PostgreSQL.
- Visual polish had to preserve keyboard use, mobile reflow, contrast and reduced motion. Browser checks found issues that were corrected before release preparation.

## What comes next

Verify a public deployment, recruit consenting users for task-based usability checks, expand sourced venues with local partners, and collect legitimate moderated observations. A map is deferred until source-verified coordinates exist. The first goal is a useful, trustworthy local directory; current conditions, clinical advice and forecasts are outside the product.

## AI and third-party disclosure

The project concept, problem description and direction came from the creator. OpenAI Codex provided substantial assistance with implementation, UI design iteration, tests, documentation and browser-demo tooling. The submission should not imply the code was written without AI assistance. Open-source frameworks, fonts and the CC0 archival photograph are credited in the repository and in the app's Sources & credits page.

## Submission links to complete

- Public repository: `https://github.com/cx-57/QuietSpace` (currently **private**; make public only after a secrets, content, and license review).
- Demo: regenerate `artifacts/quietspace-demo.webm` to include the new quiet-study and Community flows, review it, upload to an accepted video host, and insert its public URL. Existing footage predates the changes. Optionally add narration using [the script](demo-script.md).
- Hosted application: no public endpoint has been deployed in this session. Local app: `http://localhost:3000`.
- Contributor names and eligibility: the creator must supply/confirm the final Devpost team details.
