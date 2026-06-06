import {
    existsSync,
    readFileSync,
    readdirSync,
} from "fs"
import {
    basename,
    join,
} from "path"
import {
    Injectable,
} from "@nestjs/common"
import {
    load as loadYaml,
} from "js-yaml"
import {
    CodingDifficulty,
    CodingDomain,
    CodingLanguage,
    Locale,
} from "@modules/databases"
import {
    CodingProblemPathService,
} from "../path"
import type {
    CodingProblemFrontmatter,
    FrontmatterSplit,
    ParsedCodingProblem,
    ParsedCodingProblemStarterCode,
    ParsedCodingProblemTestcase,
    ParsedCodingProblemTranslation,
} from "../types"

/**
 * Parses each coding-problem mount directory into a {@link ParsedCodingProblem}:
 * reads the English `en.md` (frontmatter + statement), the optional Vietnamese
 * `vi.md` translation, and the `testcases/` folder of `<n>.in`/`<n>.out` pairs.
 */
@Injectable()
export class CodingProblemParserService {
    constructor(
        private readonly pathService: CodingProblemPathService,
    ) {}

    /**
     * Parse every problem directory under the mount root.
     * @returns parsed problems (directories missing `en.md` are skipped)
     */
    async parseMany(): Promise<Array<ParsedCodingProblem>> {
        // collect every problem directory
        const dirs = this.pathService.problemDirs()
        // parse each, dropping any that fail the minimal-shape check
        const parsed = dirs
            .map((dir) => this.parseOne(dir))
            .filter((problem): problem is ParsedCodingProblem => problem !== null)
        return parsed
    }

    /**
     * Parse a single problem directory.
     * @param dir - absolute problem directory path
     * @returns the parsed problem, or null when `en.md`/frontmatter is invalid
     */
    private parseOne(dir: string): ParsedCodingProblem | null {
        // English source is mandatory
        const enPath = join(dir,
            "en.md")
        if (!existsSync(enPath)) {
            return null
        }
        // split the English file into frontmatter + statement body
        const { data, body } = this.splitFrontmatter<CodingProblemFrontmatter>(
            readFileSync(enPath,
                "utf8"),
        )
        // a slug + title are the minimum required to seed a problem
        if (!data || !data.slug || !data.title) {
            return null
        }
        // gather testcases from the testcases/ folder, marking samples per frontmatter
        const sampleIndices = new Set(data.samples ?? [])
        const testcases = this.parseTestcases(dir,
            sampleIndices)
        // flatten the starter-code map into rows for the supported languages
        const starterCodes = this.parseStarterCodes(data.starterCodes)
        // parse the optional Vietnamese translation
        const translations = this.parseTranslations(dir,
            body)
        // parse the optional per-locale approach hints (Elasticsearch-only)
        const hints = this.parseHints(dir)
        // assemble the parsed problem with sensible defaults for optional fields
        return {
            slug: data.slug,
            difficulty: data.difficulty ?? CodingDifficulty.Easy,
            domain: data.domain ?? CodingDomain.Arrays,
            orderIndex: data.orderIndex ?? 0,
            enabled: data.enabled ?? true,
            tags: data.tags ?? [],
            timeLimitMs: data.timeLimitMs ?? 2000,
            memoryLimitKb: data.memoryLimitKb ?? 262144,
            title: data.title,
            statement: body.trim(),
            testcases,
            starterCodes,
            translations,
            hints,
        }
    }

    /**
     * Read the optional per-locale approach-hint markdown from `<dir>/hints/`.
     * Missing files simply yield no entry for that locale. These hints are
     * indexed into Elasticsearch only — never persisted to Postgres.
     *
     * @param dir - problem directory
     * @returns map of locale → hint markdown (only locales with a file present)
     */
    private parseHints(dir: string): Partial<Record<Locale, string>> {
        const hints: Partial<Record<Locale, string>> = {
        }
        // check every supported locale for a `hints/<locale>.md` file
        for (const locale of Object.values(Locale)) {
            const hintPath = this.pathService.hintPath(dir,
                locale)
            if (!existsSync(hintPath)) {
                continue
            }
            const content = readFileSync(hintPath,
                "utf8").trim()
            // skip empty hint files
            if (content.length === 0) {
                continue
            }
            hints[locale] = content
        }
        return hints
    }

    /**
     * Read `<n>.in`/`<n>.out` pairs from a problem's `testcases/` folder.
     * @param dir - problem directory
     * @param sampleIndices - order indices flagged as public samples
     * @returns testcases sorted by numeric order index
     */
    private parseTestcases(
        dir: string,
        sampleIndices: Set<number>,
    ): Array<ParsedCodingProblemTestcase> {
        // locate the testcases sub-folder
        const testcasesDir = this.pathService.testcasesDir(dir)
        // no folder → no testcases
        if (!existsSync(testcasesDir)) {
            return []
        }
        // each `<n>.in` defines one case; the matching `<n>.out` is its expected output
        return readdirSync(testcasesDir)
            .filter((file) => file.endsWith(".in"))
            .map((file) => {
                // numeric stem drives ordering + sample flagging
                const orderIndex = Number.parseInt(basename(file,
                    ".in"),
                10)
                // sibling expected-output file
                const outPath = join(testcasesDir,
                    `${orderIndex}.out`)
                return {
                    orderIndex,
                    input: readFileSync(join(testcasesDir,
                        file),
                    "utf8"),
                    expectedOutput: existsSync(outPath) ? readFileSync(outPath,
                        "utf8") : "",
                    isSample: sampleIndices.has(orderIndex),
                }
            })
            // ascending evaluation order
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
    }

    /**
     * Flatten the frontmatter `starterCodes` map into rows, keeping only known
     * {@link CodingLanguage} values.
     */
    private parseStarterCodes(
        starterCodes: CodingProblemFrontmatter["starterCodes"],
    ): Array<ParsedCodingProblemStarterCode> {
        // nothing declared → no starter code
        if (!starterCodes) {
            return []
        }
        // the set of languages we actually support
        const supported = new Set<string>(Object.values(CodingLanguage))
        // keep only entries whose key is a recognized language
        return Object.entries(starterCodes)
            .filter(([language]) => supported.has(language))
            .map(([language,
                code]) => ({
                language: language as CodingLanguage,
                code: code ?? "",
            }))
    }

    /**
     * Parse the optional `vi.md` translation; falls back to none when absent.
     * @param dir - problem directory
     * @param englishStatement - English body, used only to detect emptiness
     * @returns translation rows (currently just Vietnamese when present)
     */
    private parseTranslations(
        dir: string,
        englishStatement: string,
    ): Array<ParsedCodingProblemTranslation> {
        // Vietnamese override is optional
        const viPath = join(dir,
            "vi.md")
        if (!existsSync(viPath)) {
            return []
        }
        // split the vi file; frontmatter may carry a localized title
        const { data, body } = this.splitFrontmatter<{ title?: string }>(
            readFileSync(viPath,
                "utf8"),
        )
        // skip empty translation files
        if (body.trim().length === 0 && !data?.title) {
            return []
        }
        return [
            {
                locale: Locale.Vi,
                title: data?.title ?? "",
                statement: body.trim().length > 0 ? body.trim() : englishStatement,
            },
        ]
    }

    /**
     * Split a markdown string into YAML frontmatter + body. The file must begin
     * with a `---` fence; otherwise the whole string is treated as the body.
     */
    private splitFrontmatter<TData>(raw: string): FrontmatterSplit<TData> {
        // normalize line endings so the fence match is platform-independent
        const normalized = raw.replace(/\r\n/g,
            "\n")
        // match an opening fence, the yaml block, a closing fence, then the body
        const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
        // no frontmatter fence → empty data, full body
        if (!match) {
            return {
                data: {
                } as TData,
                body: normalized,
            }
        }
        // parse the captured yaml block; treat parse failures as empty data
        const data = (loadYaml(match[1]) ?? {
        }) as TData
        return {
            data,
            body: match[2],
        }
    }
}
