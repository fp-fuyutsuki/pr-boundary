# Decision Register

This register records the public v0.1.0 product decisions.

## Deterministic PR scope gate

PR Boundary compares a trusted base policy, a repository-controlled scope profile selected by labels, and the actual pull-request diff. It returns PASS, REVIEW_REQUIRED, or BLOCKED.

The product is for human contributors, bots, and coding agents alike. It does not interpret intent with an LLM.

## Trusted-base policy

The policy used to evaluate a pull request is loaded from .github/pr-scope.yml at the exact pull-request base SHA. The pull-request head and merge tree are never used as policy sources.

## Protected paths

Protected paths require both an allow-pattern match and allow_protected: true on the active profile. Protected paths are not permanently immutable; they require explicit privileged scope.

## One active profile

v0.1.0 allows exactly one active scope profile. Multiple scope labels produce REVIEW_REQUIRED rather than silently unioning permissions. Unknown labels using the configured scope: prefix also produce REVIEW_REQUIRED.

## Metadata-only GitHub workflow

The recommended integration uses a dedicated pull_request_target workflow that does not checkout or execute pull-request code. It uses contents: read, pull-requests: read, and narrowly scoped statuses: write for the fixed pr-boundary/scope commit status on the captured exact PR head SHA.

## Changed-file completeness

GitHub Pull Request Files pagination uses per_page: 100. If all changed files cannot be proven complete, the result is REVIEW_REQUIRED. Pull requests over the documented 3000-file API limit are not evaluated.

## Commit status merge gate

The fixed pr-boundary/scope context is the merge gate. Evaluation starts with pending; PASS maps to success, REVIEW_REQUIRED to error, and BLOCKED to failure. Operational failures and status publication failures fail the workflow.

## Local CLI

The local CLI shares the pure evaluator with the Action, loads policy from the base revision, and evaluates a base...head diff with rename detection. It uses argument arrays for Git subprocesses and does not execute project code.

## v0.1.0 non-goals

v0.1.0 does not include LLM integration, semantic review, code-quality scoring, malware scanning, automatic fixes, comments, label mutation, hosted services, telemetry, GitLab integration, or a general policy programming language.