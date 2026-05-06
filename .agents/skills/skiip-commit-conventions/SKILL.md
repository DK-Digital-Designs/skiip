---
name: skiip-commit-conventions
description: Enforce SKIIP Conventional Commit discipline for all git commit planning, staging, commit message drafting, release hygiene, and PR publication workflows. Use whenever Codex is asked to commit, create a commit message, prepare a PR, stage changes, review commit history, or fix non-standard commit wording.
---

# SKIIP Commit Conventions

Use this skill before creating, drafting, reviewing, or recommending any SKIIP commit message.

## Source Of Truth

Read `docs/delivery/COMMIT_CONVENTIONS.md` before making a commit if the convention is not already fresh in context.

All human-authored commits must follow:

```text
<type>(optional-scope): <summary>
```

## Required Behavior

Before committing:

1. Inspect `git status --short`.
2. Inspect the staged diff or the files about to be staged.
3. Confirm the staged changes form one logical commit.
4. Choose one allowed type from `docs/delivery/COMMIT_CONVENTIONS.md`.
5. Add a scope when it makes the affected area clearer.
6. Write a specific summary with a colon after the type or scope.

If unrelated changes are present, split the work or ask the user how to proceed. Do not hide unrelated work inside a broad commit.

## Never Use

Do not create messages like:

- `Fix payment state`
- `updated docs`
- `docs: plan`
- `docs: changes`
- `feat(auth)`
- `chore`
- `misc updates`

Every local commit needs a type, colon, and meaningful summary.

## Type Selection

Use:

- `feat` for net-new product or platform capability
- `fix` for corrected runtime behavior
- `docs` for documentation-only changes
- `chore` for maintenance, repo hygiene, versioning, generated updates, or operational cleanup
- `test` for test or fixture-only changes
- `refactor` for restructuring without intended behavior change
- `perf` for performance improvements
- `ci` for GitHub Actions or CI configuration
- `build` for package, dependency, bundling, or build-system changes
- `style` for formatting-only changes
- `revert` for reverting a previous commit

When a commit includes code plus tests or docs, choose the type that matches the primary reason for the change.

## Output When Asked For A Commit Message

Return only the proposed commit message unless the user asks for explanation.

Examples:

```text
fix(payments): reconcile paid orders after webhook retry
docs: add agent automation plan
chore(release): sync pre-launch version
```

## Safety Rule

If no allowed type clearly fits, stop and ask. Do not invent a new type or create an unstructured commit message.
