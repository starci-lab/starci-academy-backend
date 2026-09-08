# Historical reload and session observation

Source directory: `D:/Repositories/starci-academy-backend/.worktrees/uat/console/console-overview`

For legacy run `20260904-131500-9d511ad`, the UX verdict states that Back returned the overview with its values, reload retained the overview and balance, and a fresh profile that had never signed in landed on the sign-in surface. The source commit was `9d511ad8c4c79b2d8d6a30f06c9f387fda2ccc1b`, served from `42f29d59dfafed42bdd10111a1ffae5099a78038`.

The run did not inspect refresh-cookie exchange, client storage, expiry, refusal, or safe anonymous recovery. Its overall outcome was `fix-first` with mean `3.5455`. This historical dev observation is inconclusive, does not approve UI, and cannot promote this leaf.
