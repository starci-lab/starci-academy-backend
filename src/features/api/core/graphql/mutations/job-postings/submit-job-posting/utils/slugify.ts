/**
 * Converts a free-text title into a URL-safe slug: lowercased, diacritics
 * stripped (so Vietnamese titles slugify sensibly), non-alphanumerics
 * collapsed to single hyphens, and leading/trailing hyphens trimmed.
 *
 * @param title - Free-text title to slugify.
 * @returns A lowercase, hyphenated slug (may be empty if `title` had no
 *   alphanumeric characters — callers should fall back to a random suffix).
 *
 * @example
 * slugify("Senior Backend Engineer (Node.js)") // "senior-backend-engineer-nodejs"
 */
export const slugify = (title: string): string => {
    return title
        // Unicode-normalize so combining diacritics (é → e + ´) are isolated
        .normalize("NFD")
        // strip the isolated combining marks, leaving plain ASCII letters
        .replace(/[̀-ͯ]/g,
            "")
        .toLowerCase()
        // collapse any run of non-alphanumeric characters into one hyphen
        .replace(/[^a-z0-9]+/g,
            "-")
        // trim stray leading/trailing hyphens left by the collapse above
        .replace(/^-+|-+$/g,
            "")
}
