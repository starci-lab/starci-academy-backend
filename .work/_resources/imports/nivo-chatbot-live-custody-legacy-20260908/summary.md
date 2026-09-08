# Nivo Chatbot live-run custody — sanitized inventory

This resource records only the existence, size, SHA-256 digest, and risk classification of excluded material from the historical Chatbot worktree. It is not UAT evidence and does not promote any Work 3 node.

## Preserved separately

Product source was preserved on the source branch in commit `ce09de14`. Eighteen non-secret executable UAT tools were preserved separately in commit `64619839`.

## Excluded material

Sixty-five raw JSON result/response/runtime files remain untracked in the original worktree. A key-only scan parsed all 65 without printing values: 35 contain secret-like key names, 60 contain identity-like key names, and 7 contain response-body-like key names.

Three executable tools also remain excluded because static scanning detected direct private-material literal contexts. Their values were not printed or migrated.

Ignored custody roots `.gitmounts/data` and `.gitmounts/.snapshots` were neither inspected nor copied.

The exact excluded filenames, sizes, and hashes are in `inventory.json`. No response body, credential, token, provider secret, mounted data, account identity, or secret value is stored here.

## Retention

Decision: **KEEP** the original worktree until a secret-aware owner reviews or securely disposes of the excluded files and ignored custody roots. This inventory alone is not a substitute for their contents and makes no acceptance claim.
