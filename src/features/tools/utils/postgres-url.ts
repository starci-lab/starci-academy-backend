import {
    InvalidPostgresUrlException,
    InvalidUrlException,
} from "@modules/exceptions"

/**
 * Assert that a string is a syntactically valid PostgreSQL connection URL.
 *
 * Mirrors the validation used by the `starci utils pg-sync` CLI command so the
 * ops tools reject obviously-malformed URLs before spawning `pg_dump`.
 *
 * @throws InvalidUrlException When the string is not a parseable URL.
 * @throws InvalidPostgresUrlException When the scheme is not postgres(ql).
 */
export const assertPostgresConnectionUrl = (urlString: string): void => {
    // parse first — a non-URL string is rejected outright
    let parsed: URL
    try {
        parsed = new URL(urlString)
    } catch {
        throw new InvalidUrlException({
            urlString,
        })
    }
    // strip the trailing ":" so "postgres:" → "postgres"
    const scheme = parsed.protocol.replace(
        ":",
        "",
    )
    // only the two canonical Postgres schemes are accepted
    if (scheme !== "postgresql" && scheme !== "postgres") {
        throw new InvalidPostgresUrlException({
            urlString,
        })
    }
}

/**
 * Convert an arbitrary label into a filesystem-safe slug for use in filenames.
 *
 * Lowercases, replaces any run of non-alphanumeric characters with a single
 * hyphen and trims leading/trailing hyphens; falls back to "db" when empty.
 */
export const slugifyForFilename = (value: string): string => {
    // collapse anything that is not a-z/0-9 into single hyphens
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,
            "-")
        .replace(/^-+|-+$/g,
            "")
    // never return an empty string — it would produce a dotfile-only name
    return slug.length > 0 ? slug : "db"
}
