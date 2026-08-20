# Contributing

PR Boundary v0.1.0 is implemented as a single TypeScript package with a GitHub Action and local CLI.

Before contributing, read:

- docs/v0.1.0-spec.md
- docs/threat-model.md

The v0.1.0 scope is intentionally narrow. Please open an Issue before proposing a feature that changes the policy language, permission model, GitHub event model, or trust boundary.

Small focused contributions, fixtures, documentation fixes, and reproducible edge cases are preferred.

Do not add PR-head checkout or project-code execution to the metadata-only pull_request_target workflow. Do not add permissions beyond contents: read, pull-requests: read, and the narrowly scoped statuses: write status publication.

Do not include secrets, private repositories, or proprietary code in Issues or test fixtures.


