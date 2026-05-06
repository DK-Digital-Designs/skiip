# Commit Conventions

SKIIP uses Conventional Commits for all human-authored commits.

Every new commit message must use this format:

```text
<type>(optional-scope): <summary>
```

Examples:

```text
fix(payments): reconcile paid orders after webhook retry
feat(vendor): add scheduled collection filter
docs: document notification retry operations
chore(release): sync pre-launch version
test(orders): cover inventory finalization idempotency
```

## Allowed Types

Use one of these types:

- `feat`: user-facing feature or net-new product/platform capability
- `fix`: bug fix or corrected runtime behavior
- `docs`: documentation-only change
- `chore`: maintenance, versioning, repo hygiene, generated updates, or operational cleanup
- `test`: automated test or fixture-only change
- `refactor`: code restructuring without intended behavior change
- `perf`: performance improvement
- `ci`: GitHub Actions or CI configuration change
- `build`: package, dependency, bundling, or build-system change
- `style`: formatting-only change with no runtime behavior change
- `revert`: revert a previous commit

Do not invent new types unless this document is updated first.

## Summary Rules

- Use a colon after the type or scope.
- Keep the summary concise and specific.
- Use imperative mood where practical.
- Prefer lowercase after the colon unless a proper noun, acronym, route, or code identifier requires capitalization.
- Do not end the summary with a period.
- Avoid vague summaries such as `docs: update docs`, `docs: plan`, `fix stuff`, or `chore: changes`.

## Scopes

Scopes are optional but recommended when they clarify the affected area.

Good SKIIP scopes include:

- `auth`
- `payments`
- `orders`
- `vendor`
- `admin`
- `notifications`
- `supabase`
- `rls`
- `docs`
- `release`
- `ci`
- `site`

Examples:

```text
fix(auth): return forbidden for unauthorized admin store actions
docs(release): clarify staging promotion checklist
ci(smoke): upload Playwright artifacts on failure
```

## Breaking Changes

Use `!` only for intentional breaking changes:

```text
feat(api)!: require authenticated checkout for all buyers
```

Add a commit body explaining the breaking change and any migration or rollout requirements.

## Multi-Area Changes

Choose the type based on the primary reason for the commit.

Examples:

- Code fix plus matching test: `fix(...)`
- Feature plus docs: `feat(...)`
- Docs-only cleanup: `docs`
- CI workflow and no app behavior: `ci`

If unrelated changes require different commit types, split them into separate commits.

## Merge Commits

GitHub-generated merge commits are allowed.

Do not hand-author non-standard merge-style commits or vague local commits. Local commits should still follow Conventional Commits before being pushed.

## Before Committing

Before creating a commit:

1. Review `git status --short`.
2. Review the staged diff.
3. Confirm the staged files belong in one logical commit.
4. Pick the most accurate allowed type.
5. Add a scope when it improves clarity.
6. Write a specific summary.

If a future automation or agent is unsure which type to use, it should stop and ask rather than create a non-standard commit.
