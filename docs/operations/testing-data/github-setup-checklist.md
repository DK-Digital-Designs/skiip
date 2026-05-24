# GitHub Setup Checklist

Read this when you need the github setup checklist details from [Testing Data](../TESTING_DATA.md).

To get the staging smoke workflow fully operational in GitHub:

1. push a branch that contains [staging-smoke.yml](../../../.github/workflows/staging-smoke.yml) to GitHub
2. in the GitHub repository, open `Settings -> Environments` and create the `staging` environment if it does not already exist
3. add the seven required staging environment secrets listed above
4. if the `staging` environment uses protection rules or required reviewers, allow the workflow to run in that environment
5. open `Actions -> Staging Smoke Checks -> Run workflow`, select the target branch, optionally set `base_url`, and run the workflow manually once
6. confirm the manual run passes or use the `playwright-report` and `test-results` artifacts to fix any failure
7. merge or push the workflow file onto the repository default branch so the weekday schedule can run automatically
8. confirm the next weekday scheduled run appears after the workflow is present on the default branch

The smoke workflow is only fully operational when all of the following are true:

- the workflow file exists in GitHub
- the GitHub `staging` environment exists with all seven secrets populated
- the `PLAYWRIGHT_BASE_URL` target is reachable
- the dedicated staging buyer, seller, and admin accounts exist and can sign in successfully

Failure artifacts:

- `playwright-report`
- `test-results`
- failure screenshots
- retained Playwright traces
