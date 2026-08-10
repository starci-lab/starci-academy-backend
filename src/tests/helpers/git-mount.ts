import {
    existsSync,
    readFileSync,
    readdirSync,
} from "node:fs"
import {
    join,
} from "node:path"

/**
 * The StarCi authoring separator that delimits fields inside a mounted content
 * markdown doc. A doc is a flat sequence
 * `# field <SEP> value <SEP> # field2 <SEP> value2 ...`.
 */
const SEP = "<!-- @starci/seperator -->"

/**
 * Root of the SSOT content mount every harness grounds real cases in.
 *
 * THIS CONSTANT WAS WRONG AND NOTHING WENT RED. It read `.mount/data`, a path that no longer
 * exists: `metadata.json` declares the seed-content repo at `.gitmounts/data` and says in so many
 * words that it "Replaces .mount/data" -- while a still older `.volume/data` copy sits on disk from
 * the rename before that one. Three names for one mount, and the helpers kept the first.
 *
 * Because every harness suite gated itself on this path, a missing root did not fail anything: it
 * turned `describe` into `describe.skip`, so the whole lane reported green while running nothing at
 * all. See {@link describeWithGitMount} for why that gate is now a failure instead.
 *
 * That is the failure mode a skip-gate always has: it converts "the material is missing" into "the
 * tests passed". The path is therefore load-bearing in the same way a rule's own path constant is,
 * and it is the one thing here that can be wrong without anything turning red.
 */
const MOUNT_DATA = join(process.cwd(),
    ".gitmounts",
    "data")

/** A parsed mounted-content doc -- its fields plus convenience `title`/`body`. */
export interface GitMountDoc {
    /** Every `# field` -> value pair, verbatim. */
    fields: Record<string, string>
    /** The `title` field ("" when absent). */
    title: string
    /** The `body` field -- the doc's main markdown ("" when absent). */
    body: string
}

/**
 * Read a REAL content doc straight from the `.gitmounts` SSOT mount and parse its
 * StarCi-separator fields. This is how a harness grounds a case in the actual
 * material the app serves (a real lesson, CV sample, milestone brief, interview
 * bank) instead of a hand-made fixture.
 *
 * @param relDir - path under `.gitmounts/data` (e.g. `"cv/samples/06-senior-backend-systemdesign"`).
 * @param locale - `"en"` (default) or `"vi"` -- selects `<locale>.md`.
 * @returns the parsed {@link GitMountDoc}.
 * @throws when the file is absent -- never returns an empty doc, because a case grounded in nothing
 *   would assert against an empty string and pass.
 */
export const readGitMountDoc = (
    relDir: string,
    locale: "en" | "vi" = "en",
): GitMountDoc => {
    const file = join(MOUNT_DATA,
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

/** List the (non-dot) entries under a `.gitmounts/data` directory, sorted. */
export const listGitMountDir = (
    relDir: string,
): Array<string> => {
    const dir = join(MOUNT_DATA,
        relDir)
    if (!existsSync(dir)) {
        return []
    }
    return readdirSync(dir)
        .filter((name) => !name.startsWith("."))
        .sort()
}

/** Whether a mounted-content path exists. */
export const gitMountExists = (
    relDir: string,
): boolean => existsSync(join(MOUNT_DATA,
    relDir))

/**
 * A `describe` that FAILS when the content mount is missing, rather than skipping.
 *
 * A SKIP-GATE REPORTS GREEN FOR AN ABSENT MOUNT, which is how this lane came to run nothing at all
 * while looking healthy: the path constant had drifted to a folder that no longer existed, every
 * suite silently turned into `describe.skip`, and the last thing anyone saw was a pass. "The
 * material is missing" and "the tests passed" are different facts and must not share a colour.
 *
 * So a missing mount produces one red test naming exactly what to run. That is noisier on a machine
 * that has never synced -- deliberately: a harness nobody can run should say so out loud, once, and
 * not pretend.
 *
 * @param relDirs - the mounted paths this suite grounds its cases in.
 * @returns `describe` when every path is present, otherwise a `describe` that fails.
 */
export const describeWithGitMount = (
    relDirs: Array<string>,
): jest.Describe => {
    const missing = relDirs.filter((relDir) => !gitMountExists(relDir))
    if (missing.length === 0) {
        return describe
    }

    return ((
        name: string,
    ): void => {
        describe(name,
            () => {
                it("requires the .gitmounts content repo, which is absent",
                    () => {
                        throw new Error(
                            `This harness grounds its cases in real course material and ${missing.length} `
                            + `path(s) are missing under \`.gitmounts/data\`: ${missing.join(", ")}. `
                            + "Run `npm run sync` to clone the seed-content repo declared in metadata.json. "
                            + "This fails rather than skips on purpose -- a skipped suite reports the same "
                            + "colour as a passing one.",
                        )
                    })
            })
    }) as unknown as jest.Describe
}
