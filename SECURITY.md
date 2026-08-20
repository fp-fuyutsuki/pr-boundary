# Security Policy

## Reporting a vulnerability

Please do not open a public Issue for a vulnerability that could enable policy bypass, unsafe execution, token misuse, or supply-chain compromise.

Use GitHub's private vulnerability reporting feature when it is enabled for this repository.

If private reporting is not yet enabled, do not publish exploit details until a private reporting channel is configured.

## Security boundary

Read docs/threat-model.md.

The most important guarantee is narrow:

> A pull request should not be able to change the policy or trusted workflow logic used to authorize that same pull request.

PR Boundary is not a complete security scanner.

Scope compliance is not a security review.

The recommended integration is a dedicated metadata-only pull_request_target workflow. It must not checkout, install, build, test, import, or execute pull-request code. Its only write permission is statuses: write, used for the fixed pr-boundary/scope commit status on the exact head SHA captured by that run. It does not use secrets, OIDC, environments, repository writes, comments, label changes, or PR closing.

If the PR head, base, or relevant scope labels change before final publication, the run returns PR_STATE_CHANGED and REVIEW_REQUIRED, and never writes to the newer head SHA. Complete transactional locking is not provided.
