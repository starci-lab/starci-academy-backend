import {
    existsSync,
    readFileSync,
} from "node:fs"
import {
    basename,
    join,
} from "node:path"
import {
    Injectable,
} from "@nestjs/common"
import {
    CodingDifficulty,
} from "@modules/databases/postgresql/primary/enums/coding-difficulty"
import {
    CodingDomain,
} from "@modules/databases/postgresql/primary/enums/coding-domain"
import {
    CodingLanguage,
} from "@modules/databases/postgresql/primary/enums/coding-language"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CodingProblemPathService,
} from "../path/coding-problem-path.service"
import {
    ExtractJsonFromMdService,
} from "../../shared/extracts/extract-json-from-md.service"
import type {
    ParsedCodingProblem,
    ParsedCodingProblemSolution,
    ParsedCodingProblemStarterCode,
    ParsedCodingProblemTestcase,
    ParsedCodingProblemTranslation,
    RawCodingProblem,
    RawIoItem,
    RawLangCodeItem,
} from "../types"

/** Points awarded for a first clean solve, by difficulty tier. */
const POINTS_BY_DIFFICULTY: Record<CodingDifficulty, number> = {
    [CodingDifficulty.Easy]: 10,
    [CodingDifficulty.Medium]: 15,
    [CodingDifficulty.Hard]: 20,
}

@Injectable()
/**
 * Parses each coding-problem mount directory into a {@link ParsedCodingProblem}.
 * Problems use the house heading-markdown grammar (see {@link ExtractJsonFromMdService}):
 * one `en.md` (+ optional `vi.md`) with `# field` / `## <n>` / `### subfield`
 * sections -- per-language `starterCodes` + `solutions`, plus two IO arrays
 * (`# example` = public samples, `# testcases` = hidden judging cases).
 */
export class CodingProblemParserService {
    /** Supported difficulty values (mount string -> enum). */
    private readonly difficulties = new Set<string>(Object.values(CodingDifficulty))
    /** Supported domain values (camelCase). */
    private readonly domains = new Set<string>(Object.values(CodingDomain))
    /** Supported language values. */
    private readonly languages = new Set<string>(Object.values(CodingLanguage))

    constructor(
        private readonly pathService: CodingProblemPathService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
    ) {}

    /**
     * Parse every problem directory under the mount root.
     * @returns parsed problems (directories missing `en.md` are skipped)
     */
    async parseMany(): Promise<Array<ParsedCodingProblem>> {
        const dirs = this.pathService.problemDirs()
        return dirs
            .map((dir) => this.parseOne(dir))
            .filter((problem): problem is ParsedCodingProblem => problem !== null)
    }

    /**
     * Parse a single problem directory's `en.md` (+ optional `vi.md`).
     * @param dir - absolute problem directory path
     * @returns the parsed problem, or null when `en.md`/title is missing
     */
    private parseOne(dir: string): ParsedCodingProblem | null {
        // English source is mandatory
        const enPath = join(dir,
            "en.md")
        if (!existsSync(enPath)) {
            return null
        }
        // extract the whole problem from the heading-markdown grammar
        const raw = this.extractJsonFromMdService.extract<RawCodingProblem>(
            readFileSync(enPath,
                "utf8"),
        )
        // slug is the problem folder name; a title is the minimum to seed
        const slug = basename(dir)
        const title = (raw.title ?? "").trim()
        if (!slug || title.length === 0) {
            return null
        }
        // example cases are public samples; testcases are the hidden judging set --
        // concatenated into one list with a sequential evaluation order
        const testcases = this.buildTestcases(raw.example,
            raw.testcases)
        // difficulty drives both the tier and the points awarded on a clean solve
        const difficulty = this.coerceDifficulty(raw.difficulty)
        return {
            slug,
            difficulty,
            domain: this.coerceDomain(raw.domain),
            orderIndex: this.coerceInt(raw.orderIndex,
                0),
            sortIndex: this.coerceInt(raw.orderIndex,
                0) + 1,
            enabled: raw.enabled === undefined ? true : raw.enabled.trim() !== "false",
            tags: (raw.tags ?? [])
                .map((tag) => (tag.value ?? "").trim())
                .filter((value) => value.length > 0),
            timeLimitMs: this.coerceInt(raw.timeLimitMs,
                2000),
            memoryLimitKb: this.coerceInt(raw.memoryLimitKb,
                262144),
            points: POINTS_BY_DIFFICULTY[difficulty],
            title,
            statement: (raw.statement ?? "").trim(),
            testcases,
            starterCodes: this.buildLangCode(raw.starterCodes),
            solutions: this.buildLangCode(raw.solutions),
            translations: this.parseTranslations(dir,
                title,
                (raw.statement ?? "").trim()),
            // localized "thinking guidance" authored as the `# hint` heading field
            // (en from this file, vi from vi.md) -- indexed to Elasticsearch only
            hints: this.buildHints(raw.hint,
                dir),
        }
    }

    /**
     * Collect the per-locale `# hint` guidance: English from the problem's own
     * `en.md` (already parsed) and Vietnamese from `vi.md` when present. Empty
     * hints are omitted so the indexer skips them.
     *
     * @param enHintRaw - raw `# hint` markdown from en.md
     * @param dir - absolute problem directory path
     * @returns per-locale hint map (omits locales without a hint)
     */
    private buildHints(
        enHintRaw: string | undefined,
        dir: string,
    ): Partial<Record<Locale, string>> {
        const hints: Partial<Record<Locale, string>> = {
        }
        // English hint comes straight from the already-parsed en.md
        const enHint = (enHintRaw ?? "").trim()
        if (enHint.length > 0) {
            hints[Locale.En] = enHint
        }
        // Vietnamese hint is read from the sibling vi.md when it exists
        const viPath = join(dir,
            "vi.md")
        if (existsSync(viPath)) {
            const viRaw = this.extractJsonFromMdService.extract<RawCodingProblem>(
                readFileSync(viPath,
                    "utf8"),
            )
            const viHint = (viRaw.hint ?? "").trim()
            if (viHint.length > 0) {
                hints[Locale.Vi] = viHint
            }
        }
        return hints
    }

    /**
     * Build the testcase list: every `# example` item first (public samples),
     * then every `# testcases` item (hidden), with a sequential `orderIndex`.
     */
    private buildTestcases(
        example: Array<RawIoItem> | undefined,
        hidden: Array<RawIoItem> | undefined,
    ): Array<ParsedCodingProblemTestcase> {
        const cases: Array<ParsedCodingProblemTestcase> = []
        // public samples are shown to the user (isSample = true)
        for (const item of example ?? []) {
            cases.push(this.toTestcase(item,
                cases.length,
                true))
        }
        // hidden judging cases are never exposed (isSample = false)
        for (const item of hidden ?? []) {
            cases.push(this.toTestcase(item,
                cases.length,
                false))
        }
        return cases
    }

    /** Map one raw IO item to a parsed testcase at the given evaluation order. */
    private toTestcase(
        item: RawIoItem,
        orderIndex: number,
        isSample: boolean,
    ): ParsedCodingProblemTestcase {
        return {
            orderIndex,
            sortIndex: orderIndex,
            // verbatim leaf already trimmed by the extractor; trailing newline is
            // re-added so stdin matches an author's "one value per line" intent
            input: item.input ?? "",
            expectedOutput: item.output ?? "",
            isSample,
        }
    }

    /**
     * Map raw per-language `{lang, content}` items to typed rows, keeping only
     * recognized {@link CodingLanguage} values (shared by starter codes + solutions).
     */
    private buildLangCode(
        items: Array<RawLangCodeItem> | undefined,
    ): Array<ParsedCodingProblemStarterCode & ParsedCodingProblemSolution> {
        return (items ?? [])
            .map((item) => ({
                language: (item.lang ?? "").trim() as CodingLanguage,
                code: item.content ?? "",
            }))
            .filter((row) => this.languages.has(row.language))
    }

    /**
     * Parse the optional `vi.md` translation (title + statement).
     * @param dir - problem directory
     * @param englishTitle - English title fallback
     * @param englishStatement - English statement fallback
     * @returns translation rows (currently just Vietnamese when present)
     */
    private parseTranslations(
        dir: string,
        englishTitle: string,
        englishStatement: string,
    ): Array<ParsedCodingProblemTranslation> {
        const viPath = join(dir,
            "vi.md")
        if (!existsSync(viPath)) {
            return []
        }
        const raw = this.extractJsonFromMdService.extract<RawCodingProblem>(
            readFileSync(viPath,
                "utf8"),
        )
        const title = (raw.title ?? "").trim()
        const statement = (raw.statement ?? "").trim()
        // skip an empty translation file
        if (title.length === 0 && statement.length === 0) {
            return []
        }
        return [
            {
                locale: Locale.Vi,
                title: title.length > 0 ? title : englishTitle,
                statement: statement.length > 0 ? statement : englishStatement,
            },
        ]
    }

    /** Coerce a mount difficulty string to the enum (default Easy). */
    private coerceDifficulty(value: string | undefined): CodingDifficulty {
        const trimmed = (value ?? "").trim()
        return this.difficulties.has(trimmed)
            ? (trimmed as CodingDifficulty)
            : CodingDifficulty.Easy
    }

    /** Coerce a mount domain string to the enum (default Arrays). */
    private coerceDomain(value: string | undefined): CodingDomain {
        const trimmed = (value ?? "").trim()
        return this.domains.has(trimmed)
            ? (trimmed as CodingDomain)
            : CodingDomain.Arrays
    }

    /** Parse an integer leaf, falling back to a default when absent/invalid. */
    private coerceInt(value: string | undefined, fallback: number): number {
        const parsed = Number.parseInt((value ?? "").trim(),
            10)
        return Number.isNaN(parsed) ? fallback : parsed
    }
}
