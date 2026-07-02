/**
 * Length of the random hex suffix appended to a generated slug when the base
 * slug already exists (either a title-collision on `job_postings.display_id`
 * or on `headhunting_companies.display_id` for an inline new company).
 */
export const SLUG_SUFFIX_LENGTH = 6

/**
 * Number of suffixed-slug attempts to try before giving up and throwing
 * {@link JobPostingSlugGenerationFailedException}. With a 6-hex-char suffix
 * space (16^6 ≈ 16.7M combinations), exhausting this budget on a real
 * collision is effectively impossible — it only guards against a bug.
 */
export const MAX_SLUG_ATTEMPTS = 10
