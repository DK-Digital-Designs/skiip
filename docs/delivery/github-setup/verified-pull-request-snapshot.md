# Verified Pull Request Snapshot

Read this when you need the verified pull request snapshot details from [GitHub Setup](../GITHUB_SETUP.md).

Current open PRs:

- [#8 Add production financial audit docs: architecture analysis, risk report, and go-live checklist](https://github.com/DK-Digital-Designs/skiip/pull/8) into `main`
- [#9 docs: add financial production audit, risk report, and launch checklist](https://github.com/DK-Digital-Designs/skiip/pull/9) into `main`

Recently merged PRs relevant to current repo history:

- [#21 Topic/twilio resend notifications](https://github.com/DK-Digital-Designs/skiip/pull/21) merged into `staging` on 2026-04-22
- [#12 Launch hardening p1 ops secrets smoke](https://github.com/DK-Digital-Designs/skiip/pull/12) merged into `staging`
- [#11 Staging](https://github.com/DK-Digital-Designs/skiip/pull/11) merged `staging` into `main`
- [#10 Fix/checkout](https://github.com/DK-Digital-Designs/skiip/pull/10) merged into `staging`

Important caution:

- historical PR titles and bodies are not a reliable runtime source of truth
- for example, merged PR [#13](https://github.com/DK-Digital-Designs/skiip/pull/13) describes a Meta WhatsApp migration that does not match the current checked-in Twilio-based notification implementation
- use repository code and the docs in `docs/` as the source of truth, not historical PR descriptions

Observed PR flow from current history:

- short-lived branches commonly target `staging`
- `staging` is then promoted into `main`
