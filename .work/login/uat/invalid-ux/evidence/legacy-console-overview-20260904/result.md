# Historical invalid sign-in observation

Source directory: `D:/Repositories/starci-academy-backend/.worktrees/uat/console/console-overview`

For legacy run `20260904-131500-9d511ad`, the UX verdict states that a deliberately wrong sign-in value was refused, both entered values survived, correction occurred at the same field, and the terminal frame returned 308 ms later. The source commit was `9d511ad8c4c79b2d8d6a30f06c9f387fda2ccc1b`, served from `42f29d59dfafed42bdd10111a1ffae5099a78038`.

No retained artifact proves that invalid input blocked transport, that an invalid server response created no authenticated state, or that cookies and client storage remained clean. The historical run's overall outcome was `fix-first` with mean `3.5455`. This observation is inconclusive, does not approve UI, and cannot promote this leaf.
