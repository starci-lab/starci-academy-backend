import {
    existsSync,
    readFileSync,
} from "fs"
import {
    join,
} from "path"
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
    CodingProblemParserService,
} from "./coding-problem-parser.service"
import type {
    CodingProblemPathService,
} from "../path/coding-problem-path.service"
import type {
    ExtractJsonFromMdService,
} from "../../shared/extracts/extract-json-from-md.service"
import type {
    RawCodingProblem,
} from "../types"

// the parser reads the mount synchronously -- the filesystem is the only
// boundary it touches, so it is the only thing stubbed here
jest.mock("fs",
    () => ({
        // keep every other `fs` export real -- unrelated modules in the import
        // graph promisify `fs.readFile`, which a bare stub would erase
        ...jest.requireActual("fs"),
        existsSync: jest.fn(),
        readFileSync: jest.fn(),
    }))

/** `fs.existsSync`, typed as the jest mock the module factory installed. */
const existsSyncMock = existsSync as jest.MockedFunction<typeof existsSync>
/** `fs.readFileSync`, typed as the jest mock the module factory installed. */
const readFileSyncMock = readFileSync as jest.MockedFunction<typeof readFileSync>

describe("CodingProblemParserService",
    () => {
        let service: CodingProblemParserService
        let pathService: jest.Mocked<Pick<CodingProblemPathService, "problemDirs">>
        let extractJsonFromMdService: jest.Mocked<
            Pick<ExtractJsonFromMdService, "extract">
        >

        /** Markdown files the fake mount holds, keyed by absolute path. */
        let files: Map<string, string>
        /** Extractor output, keyed by the markdown body the fake mount returns. */
        let extracts: Map<string, RawCodingProblem>

        const problemDir = join("/mount",
            "coding-problems",
            "sets",
            "arrays",
            "problems",
            "two-sum")
        const enPath = join(problemDir,
            "en.md")
        const viPath = join(problemDir,
            "vi.md")

        /**
         * Register a markdown file plus the raw object the extractor yields for it.
         *
         * @param path - Absolute path the parser will stat/read
         * @param raw - Object the stubbed extractor returns for that body
         */
        const mountFile = (
            path: string,
            raw: RawCodingProblem,
        ): void => {
            const body = `body-of:${path}`
            files.set(path,
                body)
            extracts.set(body,
                raw)
        }

        beforeEach(() => {
            files = new Map()
            extracts = new Map()

            existsSyncMock.mockImplementation((path) => files.has(String(path)))
            readFileSyncMock.mockImplementation((path) => {
                const body = files.get(String(path))
                if (body === undefined) {
                    // mirrors the real `readFileSync` contract: reading an absent
                    // file must blow up rather than silently yield ""
                    throw new Error(`ENOENT: ${String(path)}`)
                }
                return body
            })

            pathService = {
                problemDirs: jest.fn(() => [
                    problemDir,
                ]),
            }
            extractJsonFromMdService = {
                extract: jest.fn((body: string) => extracts.get(body) ?? {
                }),
            } as unknown as jest.Mocked<Pick<ExtractJsonFromMdService, "extract">>

            service = new CodingProblemParserService(
                pathService as unknown as CodingProblemPathService,
                extractJsonFromMdService as unknown as ExtractJsonFromMdService,
            )
        })

        afterEach(() => {
            jest.clearAllMocks()
        })

        describe("parseMany",
            () => {
                it("returns an empty list when the mount holds no problem directories",
                    async () => {
                        pathService.problemDirs.mockReturnValue([])

                        await expect(service.parseMany()).resolves.toEqual([])
                        expect(readFileSyncMock).not.toHaveBeenCalled()
                    })

                it("skips a directory that has no `en.md`",
                    async () => {
                        // nothing mounted -> existsSync(en.md) is false
                        await expect(service.parseMany()).resolves.toEqual([])
                        expect(extractJsonFromMdService.extract).not.toHaveBeenCalled()
                    })

                it("skips a problem whose `# title` is blank",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "   ",
                                statement: "anything",
                            })

                        await expect(service.parseMany()).resolves.toEqual([])
                    })

                it("skips a problem with no `# title` heading at all",
                    async () => {
                        mountFile(enPath,
                            {
                            })

                        await expect(service.parseMany()).resolves.toEqual([])
                    })

                it("drops only the invalid directories and keeps the valid ones",
                    async () => {
                        const otherDir = join("/mount",
                            "coding-problems",
                            "sets",
                            "graph",
                            "problems",
                            "clone-graph")
                        pathService.problemDirs.mockReturnValue([
                            problemDir,
                            otherDir,
                        ])
                        mountFile(join(otherDir,
                            "en.md"),
                        {
                            title: "Clone Graph",
                        })

                        const problems = await service.parseMany()

                        expect(problems).toHaveLength(1)
                        expect(problems[0].slug).toBe("clone-graph")
                    })
            })

        describe("parseOne defaults",
            () => {
                it("falls back to easy/arrays/enabled with the default limits",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "  Two Sum  ",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.slug).toBe("two-sum")
                        expect(problem.title).toBe("Two Sum")
                        expect(problem.difficulty).toBe(CodingDifficulty.Easy)
                        expect(problem.domain).toBe(CodingDomain.Arrays)
                        expect(problem.orderIndex).toBe(0)
                        expect(problem.sortIndex).toBe(1)
                        expect(problem.enabled).toBe(true)
                        expect(problem.timeLimitMs).toBe(2000)
                        expect(problem.memoryLimitKb).toBe(262144)
                        expect(problem.points).toBe(10)
                        expect(problem.statement).toBe("")
                        expect(problem.tags).toEqual([])
                        expect(problem.testcases).toEqual([])
                        expect(problem.starterCodes).toEqual([])
                        expect(problem.solutions).toEqual([])
                        expect(problem.translations).toEqual([])
                        expect(problem.hints).toEqual({
                        })
                    })

                it("keeps a recognized difficulty and awards its point tier",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                difficulty: " hard ",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.difficulty).toBe(CodingDifficulty.Hard)
                        expect(problem.points).toBe(20)
                    })

                it("awards the medium point tier for a medium problem",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                difficulty: "medium",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.difficulty).toBe(CodingDifficulty.Medium)
                        expect(problem.points).toBe(15)
                    })

                it("falls back to easy when the difficulty is not a known tier",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                difficulty: "impossible",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.difficulty).toBe(CodingDifficulty.Easy)
                    })

                it("keeps a recognized domain and falls back on an unknown one",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                domain: " graph ",
                            })
                        const [
                            recognized,
                        ] = await service.parseMany()
                        expect(recognized.domain).toBe(CodingDomain.Graph)

                        files.clear()
                        extracts.clear()
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                domain: "quantum",
                            })
                        const [
                            unknown,
                        ] = await service.parseMany()
                        expect(unknown.domain).toBe(CodingDomain.Arrays)
                    })

                it("parses integer leaves and derives sortIndex from orderIndex",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                orderIndex: " 7 ",
                                timeLimitMs: "5000",
                                memoryLimitKb: "131072",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.orderIndex).toBe(7)
                        expect(problem.sortIndex).toBe(8)
                        expect(problem.timeLimitMs).toBe(5000)
                        expect(problem.memoryLimitKb).toBe(131072)
                    })

                it("falls back to the default when an integer leaf is unparseable",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                orderIndex: "abc",
                                timeLimitMs: "",
                                memoryLimitKb: "not-a-number",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.orderIndex).toBe(0)
                        expect(problem.timeLimitMs).toBe(2000)
                        expect(problem.memoryLimitKb).toBe(262144)
                    })

                it("treats an explicit `false` as disabled and any other value as enabled",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                enabled: " false ",
                            })
                        const [
                            disabled,
                        ] = await service.parseMany()
                        expect(disabled.enabled).toBe(false)

                        files.clear()
                        extracts.clear()
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                enabled: "true",
                            })
                        const [
                            enabled,
                        ] = await service.parseMany()
                        expect(enabled.enabled).toBe(true)
                    })

                it("keeps only non-empty trimmed tags",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                tags: [
                                    {
                                        value: "  hash-map  ",
                                    },
                                    {
                                        value: "   ",
                                    },
                                    {
                                    },
                                    {
                                        value: "array",
                                    },
                                ],
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.tags).toEqual([
                            "hash-map",
                            "array",
                        ])
                    })
            })

        describe("testcases",
            () => {
                it("orders public samples before hidden cases with a sequential index",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                example: [
                                    {
                                        input: "1 2",
                                        output: "3",
                                    },
                                ],
                                testcases: [
                                    {
                                        input: "4 5",
                                        output: "9",
                                    },
                                    {
                                    },
                                ],
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.testcases).toEqual([
                            {
                                orderIndex: 0,
                                sortIndex: 0,
                                input: "1 2",
                                expectedOutput: "3",
                                isSample: true,
                            },
                            {
                                orderIndex: 1,
                                sortIndex: 1,
                                input: "4 5",
                                expectedOutput: "9",
                                isSample: false,
                            },
                            {
                                orderIndex: 2,
                                sortIndex: 2,
                                input: "",
                                expectedOutput: "",
                                isSample: false,
                            },
                        ])
                    })

                it("yields hidden-only cases when there are no public samples",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                testcases: [
                                    {
                                        input: "x",
                                        output: "y",
                                    },
                                ],
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.testcases).toHaveLength(1)
                        expect(problem.testcases[0].isSample).toBe(false)
                    })
            })

        describe("per-language code",
            () => {
                it("keeps recognized languages and drops unknown ones",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                starterCodes: [
                                    {
                                        lang: " python ",
                                        content: "def solve(): ...",
                                    },
                                    {
                                        lang: "cobol",
                                        content: "IDENTIFICATION DIVISION.",
                                    },
                                    {
                                        content: "orphan",
                                    },
                                ],
                                solutions: [
                                    {
                                        lang: "cpp",
                                    },
                                ],
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.starterCodes).toEqual([
                            {
                                language: CodingLanguage.Python,
                                code: "def solve(): ...",
                            },
                        ])
                        expect(problem.solutions).toEqual([
                            {
                                language: CodingLanguage.Cpp,
                                code: "",
                            },
                        ])
                    })
            })

        describe("translations",
            () => {
                it("returns no translation when `vi.md` is absent",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.translations).toEqual([])
                    })

                it("returns no translation when `vi.md` carries neither title nor statement",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                            })
                        mountFile(viPath,
                            {
                                title: "  ",
                                statement: "",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.translations).toEqual([])
                    })

                it("uses the Vietnamese title and statement when both are authored",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                statement: "Find two numbers.",
                            })
                        mountFile(viPath,
                            {
                                title: " Tong Hai So ",
                                statement: " Tim hai so. ",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.translations).toEqual([
                            {
                                locale: Locale.Vi,
                                title: "Tong Hai So",
                                statement: "Tim hai so.",
                            },
                        ])
                    })

                it("falls back to the English title when only the statement is translated",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                statement: "Find two numbers.",
                            })
                        mountFile(viPath,
                            {
                                statement: "Tim hai so.",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.translations[0]).toEqual({
                            locale: Locale.Vi,
                            title: "Two Sum",
                            statement: "Tim hai so.",
                        })
                    })

                it("falls back to the English statement when only the title is translated",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                statement: "Find two numbers.",
                            })
                        mountFile(viPath,
                            {
                                title: "Tong Hai So",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.translations[0]).toEqual({
                            locale: Locale.Vi,
                            title: "Tong Hai So",
                            statement: "Find two numbers.",
                        })
                    })
            })

        describe("hints",
            () => {
                it("collects the English hint from `en.md`",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                hint: "  Use a hash map.  ",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.hints).toEqual({
                            [Locale.En]: "Use a hash map.",
                        })
                    })

                it("omits a blank English hint",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                hint: "   ",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.hints[Locale.En]).toBeUndefined()
                    })

                it("collects the Vietnamese hint from the sibling `vi.md`",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                                hint: "Use a hash map.",
                            })
                        mountFile(viPath,
                            {
                                title: "Tong Hai So",
                                hint: " Dung hash map. ",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.hints).toEqual({
                            [Locale.En]: "Use a hash map.",
                            [Locale.Vi]: "Dung hash map.",
                        })
                    })

                it("omits a blank Vietnamese hint even when `vi.md` exists",
                    async () => {
                        mountFile(enPath,
                            {
                                title: "Two Sum",
                            })
                        mountFile(viPath,
                            {
                                title: "Tong Hai So",
                                hint: "  ",
                            })

                        const [
                            problem,
                        ] = await service.parseMany()

                        expect(problem.hints).toEqual({
                        })
                    })
            })
    })
