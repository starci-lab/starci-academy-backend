# StarCi 3.0.0-alpha.3 — local release candidate

Prepared 2026-09-09. Not published to npm; no Git commit or push performed for this release.

Archive: `starci-3.0.0-alpha.3.tgz`

SHA-256: `6ef5a2a4a98dc1c391e4485692962d18d9d3ce8cd55c90666283492b77c4f4fd`

Public package and executable: `starci`. New project storage: `.starciwork` for durable shared BE/FE records, sibling `.starcitemp` for plan/run/approval/staging. Host `.claude` and `.workspaces` retain their roles. Explicit legacy bindings remain supported without moving project data or modifying approval receipts.

## Verification

- Full runtime suite: 252 tests passed, zero failures/skips.
- Both documentation/skills sites built; site regression passed.
- Compiled contracts: 175 files, no stale output; final ensure-build required no rebuild.
- Skill frontmatter validator passed.
- Package inventory: 451 files, 2,007,370 bytes compressed, 6,057,046 bytes unpacked.
- No packaged paths matched the checked product-state, local-config, environment-file, dependency, Git, nested archive or site-cache exclusions. This is a path inventory check, not a comprehensive secret or license audit.
- Actual archive invoked through npx and installed into an isolated Windows host.
- Installed doctor: operator 23/23, core 32/32, workflow-routing 6/6 passed; zero installation drift.
- Installed CLI initialized and validated a fresh `.starciwork` with zero errors/warnings.
- Source regression covers canonical state routing, explicit legacy routing, bootstrap upgrade preserving custom instructions and product bytes, and refusing existing metadata roots.

## Try it

From this directory, choose an empty test host:

```sh
npx --yes --package=./starci-3.0.0-alpha.3.tgz starci init --dir /absolute/test-host
npx --yes --package=./starci-3.0.0-alpha.3.tgz starci doctor --dir /absolute/test-host --quick
```

README and six user/maintainer guides are inside the archive and installed runtime. Read their release-status and migration warnings. This candidate has not been tested on macOS/Linux or through native hosted skill upload. Registry rights, full publication review and explicit publish approval remain required before public npm release.
