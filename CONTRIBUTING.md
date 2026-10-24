# Contributing to QuietSpace

QuietSpace is a community-centered directory of real public places. It is **not** a source of live noise data, crowd predictions, medical advice, or guarantees of accessibility. Contributions are welcome if they make the evidence clearer without collecting sensitive personal information.

## Suggest a public venue

Use [Suggest a public space](https://github.com/cx-57/QuietSpace/issues/new?template=suggest-place.yml) to nominate a library, public park, community center, museum or comparable public venue. This form is available once the repository is public and requires a GitHub account; issues and contributor usernames are public.

Include the official venue name, its city/neighborhood, and at least one official municipal, library or venue website supporting its public address and access conditions. If a quiet/study room, seating, step-free access or accessible facility is listed, link the exact supporting page.

A venue suggestion **does not** automatically become part of the directory. Maintainership should independently check each source, confirm that the location is public and the factual details are specific, record a real verification date, and reject any claim that is unsupported. If a facility cannot be verified, mark it **unknown**, not false or true. We currently use a 90-day freshness window for published sourced facts.

Do not add scraped user reviews, photographs without reuse rights, fabricated venue scores, coordinates inferred from guesses, or copyrighted marketing copy.

## Submit a firsthand sensory observation

When the app is connected to a verified production reporting service, visit a place and use its **Share a community review** route. Submit only the dimensions you actually noticed, on a 1–5 scale for noise, crowds, brightness and scent; leave unknown dimensions empty.

Observations are *subjective*. There is no requirement to disclose a name, diagnosis, home address, personal story or device location. Avoid reporting a precise visit time if making that timestamp publicly visible after approval would reveal a sensitive routine.

All reports start **pending**. A trusted moderator must approve them before they count toward community evidence or appear as structured review cards. The app intentionally does not support open-ended written testimonials or user-uploaded photos. Do **not** post your visit timestamps or medical details as public GitHub issues.

If public reporting is not yet enabled, the directory is read-only. The community dashboard truthfully shows zero approved contributions rather than inventing data.

## Suggest a product improvement

Use the [Community feedback](https://github.com/cx-57/QuietSpace/issues/new?template=community-feedback.yml) issue form to report issues with discovery, source clarity, mobile use, accessibility or the contribution experience.

Reproducible product steps are helpful. Do not include any passwords, authentication tokens, private personal details, diagnoses or precise private location data in public issues.

## Code and data changes

- Maintain the distinction between *verified venue facilities*, *approved visitor observations*, *user-selected preferences*, and *unknowns*.
- Keep source URLs, review dates, source notes and facility claims narrow and accurate. Import updates must pass the Python schema validator.
- Only approved, non-fixture reports may affect published scores. Do not seed synthetic ratings into a real venue.
- Preserve privacy boundaries, moderated pending-only submissions, rate limits, RLS, and timestamp freshness.
- Run `npm run check` and `python3 -m unittest discover -s tests -p 'test_*.py' -v`. On Mac, follow [the quickstart](docs/quickstart-macos.md). Connected database/browser tests are required before modifying the report pipeline.
- Note what you personally verified versus what remains untested, particularly where GitHub Actions cannot run.

## Community standards

Be specific, accurate and respectful. Contributors should not imply that all libraries are quiet, that a public park is uncrowded, or that one entrance confirms universal access. People experience the same environment differently. Treat uncertain evidence as an honest starting point, not a problem to hide.

The repository must be public for general GitHub issue participation. Check its actual visibility and current license/attribution before inviting outside code contributions; public visibility alone does **not** grant a general reuse license.
