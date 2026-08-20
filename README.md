# PR Boundary

**Keep pull requests inside the scope maintainers approved.**

PR Boundary compares the actual files changed by a pull request with a policy loaded from the trusted base revision.

- Deterministic
- No LLM or API key
- No telemetry
- Does not execute pull-request code
- Works with humans, bots, and coding agents

```text
PR label: scope:docs

PASS
  README.md
  docs/install.md

BLOCKED
  .github/workflows/release.yml
  Reason: protected path
```

The v0.1.0 implementation is a single TypeScript package containing the pure evaluator, GitHub Action adapter, local CLI, tests, and reproducible bundles.

## GitHub Action

Use a dedicated metadata-only `pull_request_target` workflow. Do not checkout, install, build, test, import, or execute PR code in this workflow.

```yaml
name: PR Boundary

on:
  pull_request_target:
    types: [opened, reopened, synchronize, labeled, unlabeled, edited, ready_for_review]

concurrency:
  group: pr-boundary-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: read
  statuses: write

jobs:
  scope:
    runs-on: ubuntu-latest
    steps:
      - uses: fp-fuyutsuki/pr-boundary@8f40124c658331bf4ec752462a19242ba0272661
        with:
          github-token: ${{ github.token }}
```

The fixed commit-status context is `pr-boundary/scope`. It is published to the exact PR head SHA captured by that run. Configure this context as required in branch protection or repository rulesets. A changed head, base, or relevant scope label produces `PR_STATE_CHANGED` / `REVIEW_REQUIRED`; the stale run does not write to the newer head.

The workflow does not need `actions/checkout`, secrets, OIDC, environments, repository writes, comments, label changes, or PR closing. `statuses: write` is used only for the fixed commit status.

## Local CLI

```text
pr-boundary check --base <ref> --head <ref> --profile <name>
```

The CLI uses the same pure evaluator, loads policy from the base revision, and does not use the GitHub API or execute project code.

See:

- [`docs/v0.1.0-spec.md`](docs/v0.1.0-spec.md)
- [`docs/threat-model.md`](docs/threat-model.md)
- [`docs/decision-register.md`](docs/decision-register.md)

> Scope compliance is not a security review.

