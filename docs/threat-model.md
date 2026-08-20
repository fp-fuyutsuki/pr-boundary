# Threat Model

## 1. Security objective

PR Boundary protects one narrow decision:

> Did the pull request change repository paths outside the scope the repository intended to authorize?

It does not prove that authorized code is safe or correct.

## 2. Trust zones

### Trusted

- released PR Boundary Action code pinned by the consuming repository
- consuming repository's trusted workflow definition
- exact PR base revision
- policy blob loaded from exact base SHA
- GitHub API authenticated with contents: read, pull-requests: read, and statuses: write only; status writes are limited to the fixed pr-boundary/scope context on the captured exact PR head SHA

### Untrusted

- PR head contents
- PR merge contents
- filenames and previous filenames
- PR title/body
- branch name
- fork repository
- contributor-controlled source code
- arbitrary changed files

### Repository-controlled but not actor-audited in v0.1.0

- current PR labels

v0.1.0 trusts current label state but does not prove which actor applied a label.

## 3. Primary threats

### T1: policy self-modification

Attack:

A PR changes `.github/pr-scope.yml` to broaden its own permissions.

Mitigation:

Evaluate policy from exact base SHA, never head/merge workspace.

### T2: workflow self-modification

Attack:

A PR modifies the scope-gate workflow so the gate always passes.

Mitigation:

Recommended v0.1.0 integration uses a dedicated metadata-only `pull_request_target` workflow, which runs trusted base-repository workflow code.

The workflow must not checkout or execute PR code.

### T3: privileged workflow executes PR code

Attack:

A `pull_request_target` job checks out PR head and runs install/build/test, exposing privileged context.

Mitigation:

PR Boundary documentation explicitly forbids PR-head/merge checkout and execution in the gate workflow.

The gate requires `contents: read`, `pull-requests: read`, and `statuses: write` only. The status permission is used solely for the fixed `pr-boundary/scope` commit status on the run's captured exact PR head SHA. It uses no secrets, no OIDC, no environment, and no repository, pull-request, issue, or label writes.

### T4: file list truncation

Attack/failure:

A very large PR exceeds the GitHub files API response limit; evaluator sees only a safe subset.

Mitigation:

Paginate fully and compare retrieved count with expected changed-file count. GitHub documents a 3000-file maximum. Counts greater than 3000 are not evaluated; exactly 3000 is accepted only when all records and the expected count match. Incomplete lists -> `REVIEW_REQUIRED`.

### T4a: stale run status overwrite

Attack/failure:

An older run finishes after a newer PR head is available and writes an evaluation result to the newer head, overwriting the newer run's status.

Mitigation:

Each run captures its own head SHA, publishes pending there, and never publishes a final status to a different SHA. A final state change produces `PR_STATE_CHANGED` and `REVIEW_REQUIRED`; workflow concurrency cancels older in-progress runs for the same PR number.

### T5: rename bypass

Attack:

A protected file is renamed and evaluator checks only the new path.

Mitigation:

Evaluate both old and new path.

### T6: path traversal / path confusion

Attack:

Malformed path tricks matcher into an unintended match.

Mitigation:

Canonical POSIX repository paths; reject absolute paths, NUL, `..` segments, and malformed paths. Test Windows separator differences.

### T7: Markdown/log spoofing

Attack:

A malicious filename injects Markdown, line breaks, or misleading log output.

Mitigation:

Escape and sanitize untrusted display values. Never use untrusted strings as shell code.

### T8: symlink/submodule execution

Attack:

Evaluation follows or executes repository-controlled references.

Mitigation:

Do not dereference symlinks. Do not clone submodules. Evaluate path records only.

### T9: label ambiguity

Failure:

Two scope labels or a misspelled unknown scope label produces accidental union/broadening.

Mitigation:

No profile union in v0.1.0. Multiple or unknown prefixed labels -> `REVIEW_REQUIRED`.

### T10: protected-path wildcard broadening

Failure:

A broad profile like `**` accidentally authorizes workflows.

Mitigation:

Protected paths require both ordinary allow match and `allow_protected: true`.

## 4. `pull_request_target` rationale

GitHub's official documentation states that `pull_request_target` executes workflow code from the base repository/default branch context and warns that running untrusted PR code in this privileged context is dangerous.

PR Boundary uses this event only because the gate needs trusted workflow logic while inspecting PR metadata.

The safe-use contract is therefore strict:

- dedicated workflow
- explicit contents: read, pull-requests: read, and narrowly scoped statuses: write permissions
- no secrets
- no OIDC
- no PR checkout
- no PR install/build/test
- no shell evaluation of PR data
- no status writes other than the fixed commit status required by the merge gate

If future GitHub capabilities provide an equally simple lower-trust event with the same self-tamper resistance, reconsider this decision.

## 5. Supply-chain threat

Consumers should pin third-party Actions to immutable full commit SHAs where practical.

The project should keep runtime dependencies small and review dependency updates.

Release publishing should use npm Trusted Publishing/OIDC if npm distribution is adopted.

## 6. Out of scope

PR Boundary does not protect against:

- malicious code inside an authorized path
- compromised maintainer account
- malicious authorized label application
- compromised GitHub infrastructure
- compromised pinned Action release
- repository administrator intentionally weakening policy
- vulnerabilities unrelated to changed-path authorization
