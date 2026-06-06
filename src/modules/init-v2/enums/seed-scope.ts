/**
 * Seed scope mode for the git-sourced init (env `DATA_GIT_SEED_SCOPE`).
 *
 * A fresh `.contexts` (first pull, no prior SHA marker) is always treated as
 * {@link DataGitSeedScope.All} regardless of the configured value.
 */
export enum DataGitSeedScope {
    /** Full reseed: ignore the diff and seed every configured item. */
    All = "all",
    /** Selective: seed only what changed since the last pull. */
    Diff = "diff",
    /** Pull only: refresh `.contexts`, run no seeding/sync. */
    None = "none",
}
