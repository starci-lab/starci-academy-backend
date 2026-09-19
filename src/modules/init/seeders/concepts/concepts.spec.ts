import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ExtractJsonFromMdService,
} from "../shared/extracts/extract-json-from-md.service"
import {
    ConceptIdFactoryService,
} from "./id-factories/concept.service"
import {
    ConceptSectionIdFactoryService,
} from "./id-factories/concept-section.service"
import {
    ConceptInsertService,
} from "./insert.service"
import {
    ConceptParserService,
} from "./parser.service"
import {
    ConceptSeederService,
} from "./seeder.service"

const leaf = (name: string, value: string): string => [
    `# ${name}`,
    "<!-- @starci/seperator -->",
    value,
    "<!-- @starci/seperator -->",
].join("\n")

const conceptMarkdown = (locale: Locale): string => [
    leaf("title",
        locale === Locale.En ? "Request lifecycle" : "Vòng đời request"), // vn-ok: bilingual mount fixture
    leaf("description",
        locale === Locale.En ? "Choose the correct layer." : "Chọn đúng tầng."), // vn-ok: bilingual mount fixture
    leaf("category",
        "backend"),
    leaf("difficulty",
        "foundation"),
    leaf("minutesRead",
        "65"),
    leaf("implementation",
        "typescript"),
    leaf("sortIndex",
        "4"),
    leaf("body",
        locale === Locale.En ? "## Opening\nRead first." : "## Opening VI\nRead first VI."),
    leaf("learningOutcomes",
        JSON.stringify([{
            id: "mechanism",
            text: locale === Locale.En ? "Trace the pipeline" : "Theo dõi pipeline", // vn-ok: bilingual mount fixture
        }])),
    leaf("prerequisites",
        JSON.stringify([{
            id: "http",
            text: "HTTP",
        }])),
    leaf("references",
        JSON.stringify([{
            id: "nest-docs",
            label: "NestJS docs",
            url: "https://docs.nestjs.com/faq/request-lifecycle",
        }])),
    leaf("workspace",
        JSON.stringify({
            runtime: "Node.js 24",
            files: [{
                path: "workspace/source.ts",
                role: "source",
            }],
        })),
    leaf("activities",
        JSON.stringify([{
            id: "retrieval-1",
            kind: "explain",
            stableKey: "retrieval-1",
            prompt: locale === Locale.En ? "Explain the order" : "Giải thích thứ tự", // vn-ok: bilingual mount fixture
            answer: {
                explanation: "A guarded answer",
            },
            rubric: [{
                id: "criterion-1",
                criterion: "Uses evidence",
                expectedEvidence: "Names the trace",
                maxScore: 2,
            }],
        }])),
].join("\n")

const sectionMarkdown = (locale: Locale, activities?: unknown): string => [
    leaf("title",
        locale === Locale.En ? "Predict" : "Dự đoán"), // vn-ok: bilingual mount fixture
    leaf("phase",
        "predict"),
    leaf("sortIndex",
        "1"),
    leaf("body",
        locale === Locale.En
            ? "Use this diagram:\n```mermaid\nflowchart LR\nA --> B\n```"
            : "Dùng sơ đồ này:\n```mermaid\nflowchart LR\nA --> B\n```"), // vn-ok: bilingual mount fixture
    leaf("activities",
        JSON.stringify(activities ?? [{
            id: "predict-order",
            kind: "choice",
            prompt: "Which trace?",
            options: [{
                id: "a",
                label: "A then B",
                explanation: "Correct ordering",
                isCorrect: true,
            },
            {
                id: "b",
                label: "B then A",
                isCorrect: false,
            }],
            answer: {
                explanation: "A precedes B",
            },
        }])),
].join("\n")

describe("Concepts V1 init domain",
    () => {
        const conceptPath = {
            relativePath: "0-request-response-lifecycle",
            orderIndex: 0,
            displayId: "request-response-lifecycle",
        }
        const sectionPath = {
            relativePath: "0-request-response-lifecycle/sections/0-predict",
            orderIndex: 0,
            displayId: "predict",
        }

        const parser = (overrides: Record<string, string> = {
        }): ConceptParserService => {
            const sources: Record<string, string> = {
                "concepts/0-request-response-lifecycle/en.md": conceptMarkdown(Locale.En),
                "concepts/0-request-response-lifecycle/vi.md": conceptMarkdown(Locale.Vi),
                "concepts/0-request-response-lifecycle/sections/0-predict/en.md":
                    sectionMarkdown(Locale.En),
                "concepts/0-request-response-lifecycle/sections/0-predict/vi.md":
                    sectionMarkdown(Locale.Vi),
                ...overrides,
            }
            const conceptIds = new ConceptIdFactoryService()
            return new ConceptParserService(
                {
                    paths: jest.fn(async () => [conceptPath]),
                } as never,
                {
                    paths: jest.fn(async () => [sectionPath]),
                } as never,
                {
                    load: jest.fn(async (base: string, relative: string) => {
                        const value = sources[`${base}/${relative}`]
                        if (!value) {
                            throw new Error(`missing ${base}/${relative}`)
                        }
                        return value
                    }),
                } as never,
                new ExtractJsonFromMdService(),
                conceptIds,
                new ConceptSectionIdFactoryService(conceptIds),
            )
        }

        it("parses bilingual Markdown, preserves Mermaid and keeps answers private in JSONB",
            async () => {
                const [result] = await parser().parseMany()
                expect(result.concept.displayId).toBe("request-response-lifecycle")
                expect(result.concept.orderIndex).toBe(0)
                expect(result.concept.sortIndex).toBe(4)
                expect(result.concept.workspace).toEqual(expect.objectContaining({
                    runtime: "Node.js 24",
                }))
                expect(result.concept.activities?.[0]).toEqual(expect.objectContaining({
                    stableKey: "retrieval-1",
                    answer: {
                        explanation: "A guarded answer",
                    },
                }))
                expect(result.concept.translations).toHaveLength(2)
                expect(result.concept.translations?.find(
                    (translation) => translation.locale === Locale.Vi,
                )?.title).toBe("Vòng đời request") // vn-ok: verifies localized persistence
                const section = result.concept.sections?.[0]
                expect(section?.body).toContain("```mermaid")
                expect(section?.activities?.[0].options?.[0]).toEqual(expect.objectContaining({
                    explanation: "Correct ordering",
                    isCorrect: true,
                }))
                expect(section?.id).toBe(
                    new ConceptSectionIdFactoryService(new ConceptIdFactoryService())
                        .generate("request-response-lifecycle",
                            "predict"),
                )
            })

        it("rejects malformed private activity metadata before persistence",
            async () => {
                await expect(parser({
                    "concepts/0-request-response-lifecycle/sections/0-predict/en.md":
                        sectionMarkdown(Locale.En,
                            [{
                                id: "bad-simulation",
                                kind: "simulation",
                                prompt: "Try it",
                            }]),
                }).parseMany()).rejects.toThrow("activities must be a valid JSON array")
            })

        it("rejects locale metadata and activity topology drift",
            async () => {
                const viConcept = conceptMarkdown(Locale.Vi).replace(
                    "<!-- @starci/seperator -->\nbackend\n<!-- @starci/seperator -->",
                    "<!-- @starci/seperator -->\nfrontend\n<!-- @starci/seperator -->",
                )
                await expect(parser({
                    "concepts/0-request-response-lifecycle/vi.md": viConcept,
                }).parseMany()).rejects.toThrow(
                    "must preserve English metadata and structural IDs",
                )

                await expect(parser({
                    "concepts/0-request-response-lifecycle/sections/0-predict/vi.md":
                        sectionMarkdown(Locale.Vi,
                            [{
                                id: "different-choice",
                                kind: "choice",
                                prompt: "Which trace?",
                            }]),
                }).parseMany()).rejects.toThrow(
                    "must preserve English metadata and structural IDs",
                )
            })

        it("keeps deterministic IDs stable independently of folder order",
            () => {
                const ids = new ConceptIdFactoryService()
                const sections = new ConceptSectionIdFactoryService(ids)
                expect(ids.generate("vpc-routing")).toBe(ids.generate("vpc-routing"))
                expect(sections.generate("vpc-routing",
                    "experiment")).toBe(sections.generate("vpc-routing",
                    "experiment"))
                expect(ids.generate("vpc-routing")).not.toBe(ids.generate("cqrs-read-models"))
            })

        it("uses one complete root sync and parent-scoped section sync",
            async () => {
                const upsertMany = jest.fn(async () => ({
                    createIds: [],
                    updateIds: [],
                    deleteIds: [],
                }))
                const upsertTranslationMany = jest.fn(async () => undefined)
                const service = new ConceptInsertService({
                    transaction: async (work: (value: {
                        upsertMany: typeof upsertMany
                        upsertTranslationMany: typeof upsertTranslationMany
                    }) => Promise<void>) => work({
                        upsertMany,
                        upsertTranslationMany,
                    }),
                } as never)
                const parsed = await parser().parseMany()
                const concept = parsed[0].concept
                await service.insertAll([
                    concept,
                    {
                        ...concept,
                        id: new ConceptIdFactoryService().generate("second"),
                        displayId: "second",
                        sections: [],
                    },
                ])
                const rootCall = (upsertMany as jest.Mock).mock.calls[0]
                expect(rootCall[1]).toHaveLength(2)
                expect(rootCall[2]).toEqual({
                })
                expect(upsertMany).toHaveBeenCalledWith(
                    expect.any(Function),
                    expect.any(Array),
                    {
                        concept: {
                            id: concept.id,
                        },
                    },
                )
            })

        it("does not issue any upsert when the mount root is missing or empty",
            async () => {
                const insertAll = jest.fn(async () => undefined)
                const service = new ConceptSeederService({
                    parseMany: jest.fn(async () => []),
                } as never,
                {
                    insertAll,
                } as never)
                await service.seed()
                expect(insertAll).not.toHaveBeenCalled()
            })
    })
