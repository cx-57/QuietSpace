# Accounts, reviews and useful discovery

Goal: expand Boston coverage and let someone find places using saved preferences, create an account and leave a persistent review.

Architecture: retain Next.js and the existing source-backed directory. Add a SQLite store on this server for accounts, sessions, saved preferences and visitor reviews. Browsing remains available without an account. Visitor reviews publish as explicitly unverified experiences; they do not become moderator-approved sensory observations.

Choices: use Node 24's SQLite and crypto rather than adding a hosted identity dependency for this local running app. Use usernames and display names rather than collecting email addresses. Password reset by email and shared cloud hosting are outside this local implementation.

- [x] Test password verification, sessions, private preference ownership, review persistence and deletion in an isolated temporary database.
- [x] Implement account/session APIs with password hashing, HTTP-only cookies, same-origin checks, bounded input and login throttling.
- [x] Implement sign-up/sign-in/account screens, saved preferences and signed-in review submission/deletion.
- [x] Connect review links from community and venue pages. Display visitor reviews separately from approved sensory observations.
- [x] Add official-source venues with honest unknown sensory levels; exclude known closed branches.
- [x] Add immediate preference results, source-based recommendation explanations and a supported-matches filter.
- [x] Run the unit suite, lint, typecheck and real browser checks through registration, preferences, reviewing and logout. Keep the local server running.

Review focus: cross-site writes, anonymous review submission, session expiry/revocation, cross-account deletion, preference restoration and sensory claims without evidence.

Validation: 42 Node tests, 26 Python tests, lint and typecheck passed. Optimized Next production build passed. Real Chrome flow checked 29 places, six preference presets, account registration/sign-in/sign-out, review publication/persistence/deletion, saved preference restoration, CSRF rejection and mobile width. Simplified the hero, search/filter layout, cards, navigation and branding after user feedback.
