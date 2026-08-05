import {
    existsSync,
    readFileSync,
    readdirSync,
} from "node:fs"
import {
    join,
} from "node:path"

/**
 * The StarCi authoring separator that delimits fields inside a `.volume/data`
 * markdown doc. A doc is a flat sequence
 * `# field <SEP> value <SEP> # field2 <SEP> value2 ...`.
 */
const SEP = "<!-- @starci/seperator -->"

/** Root of the SSOT content mount every harness grounds real cases in. */
const VOLUME_DATA = join(process.cwd(),
    ".volume",
    "data")

/** A parsed `.volume/data` doc -- its fields plus convenience `title`/`body`. */
export interface VolumeDoc {
    /** Every `# field` -> value pair, verbatim. */
    fields: Record<string, string>
    /** The `title` field ("" when absent). */
    title: string
    /** The `body` field -- the doc's main markdown ("" when absent). */
    body: string
}

/**
 * Read a REAL content doc straight from the `.volume` SSOT mount and parse its
 * StarCi-separator fields. This is how a harness grounds a case in the actual
 * material the app serves (a real lesson, CV sample, milestone brief, interview
 * bank) instead of a hand-made fixture.
 *
 * @param relDir - path under `.volume/data` (e.g. `"cv/samples/06-senior-backend-systemdesign"`).
 * @param locale - `"en"` (default) or `"vi"` -- selects `<locale>.md`.
 * @returns the parsed {@link VolumeDoc}.
 * @throws when the file is absent (a harness should skip the case, not silently pass on empty).
 */
export const readVolumeDoc = (
    relDir: string,
    locale: "en" | "vi" = "en",
): VolumeDoc => {
    const file = join(VOLUME_DATA,
        relDir,
        `${locale}.md`)
    const raw = readFileSync(file,
        "utf8")

    const parts = raw
        .split(SEP)
        .map((part) => part.trim())

    const fields: Record<string, string> = {
    }
    for (let index = 0; index + 1 < parts.length; index += 2) {
        const key = parts[index].replace(/^#\s*/,
            "").trim()
        if (key) {
            fields[key] = parts[index + 1]
        }
    }

    return {
        fields,
        title: fields.title ?? "",
        body: fields.body ?? "",
    }
}

/** List the (non-dot) entries under a `.volume/data` directory, sorted. */
export const listVolumeDir = (
    relDir: string,
): Array<string> => {
    const dir = join(VOLUME_DATA,
        relDir)
    if (!existsSync(dir)) {
        return []
    }
    return readdirSync(dir)
        .filter((name) => !name.startsWith("."))
        .sort()
}

/** Whether a `.volume/data` path exists (lets a harness skip when the mount is absent). */
export const volumeExists = (
    relDir: string,
): boolean => existsSync(join(VOLUME_DATA,
    relDir))
