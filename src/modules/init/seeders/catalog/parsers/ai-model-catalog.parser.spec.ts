import {
    AiModelCatalogParserService
} from "./ai-model-catalog.parser"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"
describe("AiModelCatalogParserService",
    () => {
        it("skips unreadable entries and returns an empty catalog",
            async () => { const paths = jest.fn().mockResolvedValue([{
                relativePath: "1-model", displayId: "model", orderIndex: 1
            }]); const load = jest.fn().mockRejectedValue(new Error("missing")); const service = new AiModelCatalogParserService({
                paths
            } as never,
{
    load
} as never,
{
    extract: jest.fn()
} as never,
{
} as never,
{
    log: jest.fn()
} as never); await expect(service.parseManyWithTranslations()).resolves.toEqual([]); expect(load).toHaveBeenCalled() })

        it("parses a valid model, derives billing fields, and falls back missing Vietnamese text",
            async () => {
                const load = jest.fn()
                    .mockResolvedValueOnce("english")
                    .mockRejectedValueOnce(new Error("missing vi"))
                const extract = jest.fn().mockReturnValue({
                    name: "gpt-test",
                    provider: ModelProvider.OpenAI,
                    category: AiModelCategory.Low,
                    keysFilePath: "keys/test",
                    priority: 2,
                    priceInUsdPerMTok: 1,
                    priceOutUsdPerMTok: 2,
                    contextWindowTokens: 1000,
                    enabled: true,
                    complimentary: false,
                    supportedTasks: "chatting,unknown,chatting",
                    label: "Test model",
                    description: "English description",
                })
                const service = new AiModelCatalogParserService({
                    paths: jest.fn().mockResolvedValue([{
                        relativePath: "1-test",
                        displayId: "test",
                        orderIndex: 1,
                    }]),
                } as never,
{
    load
} as never,
{
    extract
} as never,
{
    toRequiredString: jest.fn((value: unknown, fallback: string) =>
        typeof value === "string" && value.length > 0 ? value : fallback),
    toRequiredEnum: jest.fn((value: unknown, values: object, fallback: unknown) =>
        Object.values(values).includes(value) ? value : fallback),
    toRequiredNumber: jest.fn((value: unknown, fallback: number) =>
        typeof value === "number" ? value : fallback),
    toRequiredBoolean: jest.fn((value: unknown, fallback: boolean) =>
        typeof value === "boolean" ? value : fallback),
} as never,
{
    log: jest.fn()
} as never)

                const result = await service.parseManyWithTranslations()
                expect(result).toHaveLength(1)
                expect(result[0].model.name).toBe("gpt-test")
                expect(result[0].model.supportedTasks).toEqual(["chatting"])
                expect(result[0].vi).toEqual(result[0].en)
                expect(result[0].model.credit).toBeGreaterThan(0)
                expect(load).toHaveBeenNthCalledWith(2,
                    "ai-models",
                    "1-test/vi.md")
            })

        it("skips invalid model rows and maps a partial Vietnamese translation",
            async () => {
                const paths = jest.fn().mockResolvedValue([
                    {
                        relativePath: "1-invalid",
                        displayId: "invalid",
                        orderIndex: 1,
                    },
                    {
                        relativePath: "2-valid",
                        displayId: "valid",
                        orderIndex: 2,
                    },
                ])
                const load = jest.fn()
                    .mockResolvedValueOnce("invalid-en")
                    .mockResolvedValueOnce("valid-en")
                    .mockResolvedValueOnce("valid-vi")
                const extract = jest.fn()
                    .mockReturnValueOnce({
                        name: "invalid",
                        provider: ModelProvider.OpenAI,
                        category: AiModelCategory.Low,
                        keysFilePath: "keys/invalid",
                        priority: 1,
                        priceInUsdPerMTok: 1,
                        priceOutUsdPerMTok: 1,
                        contextWindowTokens: 1,
                        enabled: "invalid",
                        complimentary: false,
                        supportedTasks: undefined,
                        label: "Invalid",
                        description: "Invalid",
                    })
                    .mockReturnValueOnce({
                        name: "valid",
                        provider: ModelProvider.OpenAI,
                        category: AiModelCategory.Low,
                        keysFilePath: "keys/valid",
                        priority: 1,
                        priceInUsdPerMTok: 1,
                        priceOutUsdPerMTok: 1,
                        contextWindowTokens: 0,
                        enabled: true,
                        complimentary: false,
                        supportedTasks: "chatting\ngrading",
                        label: "Valid",
                        description: "English",
                    })
                    .mockReturnValueOnce({
                        label: "",
                        description: "Vietnamese description",
                    })
                const coerce = {
                    toRequiredString: jest.fn((value: unknown, fallback: string) =>
                        typeof value === "string" ? value : fallback),
                    toRequiredEnum: jest.fn((value: unknown, values: object, fallback: unknown) =>
                        Object.values(values).includes(value) ? value : fallback),
                    toRequiredNumber: jest.fn((value: unknown, fallback: number) =>
                        typeof value === "number" ? value : fallback),
                    toRequiredBoolean: jest.fn((value: unknown, fallback: boolean) =>
                        typeof value === "boolean" ? value : value ?? fallback),
                }
                const log = jest.fn()
                const service = new AiModelCatalogParserService(
                {
                    paths,
                } as never,
                {
                    load,
                } as never,
                {
                    extract,
                } as never,
                coerce as never,
                {
                    log,
                } as never,
                )

                await expect(service.parseMany()).resolves.toEqual([
                    expect.objectContaining({
                        name: "valid",
                        contextWindowTokens: null,
                        supportedTasks: ["chatting",
                            "grading"],
                    }),
                ])
                expect(log).toHaveBeenCalled()
                expect(extract).toHaveBeenCalledTimes(3)
            })

        it("rejects each invalid model shape before loading translations",
            async () => {
                const valid = {
                    name: "model",
                    provider: ModelProvider.OpenAI,
                    category: AiModelCategory.Low,
                    keysFilePath: "keys/model",
                    priority: 1,
                    priceInUsdPerMTok: 1,
                    priceOutUsdPerMTok: 1,
                    contextWindowTokens: 100,
                    enabled: true,
                    complimentary: false,
                    supportedTasks: "chatting",
                }
                const rows = [
                    {
                        ...valid, name: ""
                    },
                    {
                        ...valid, provider: "unknown"
                    },
                    {
                        ...valid, category: "unknown"
                    },
                    {
                        ...valid, keysFilePath: ""
                    },
                    {
                        ...valid, priority: Number.NaN
                    },
                    {
                        ...valid, complimentary: "no"
                    },
                    {
                        ...valid, enabled: "yes"
                    },
                ]
                const load = jest.fn().mockResolvedValue("english")
                const extract = jest.fn()
                    .mockImplementation(() => rows.shift())
                const log = jest.fn()
                const service = new AiModelCatalogParserService(
                    {
                        paths: jest.fn().mockResolvedValue(rows.map((_row, index) => ({
                            relativePath: `${index}-invalid`,
                            displayId: `invalid-${index}`,
                            orderIndex: index,
                        }))),
                    } as never,
                    {
                        load
                    } as never,
                    {
                        extract
                    } as never,
                    {
                        toRequiredString: jest.fn((value: unknown, fallback: string) =>
                            typeof value === "string" ? value : fallback),
                        toRequiredEnum: jest.fn((value: unknown, values: object) =>
                            Object.values(values).includes(value) ? value : value),
                        toRequiredNumber: jest.fn((value: unknown, fallback: number) =>
                            typeof value === "number" ? value : fallback),
                        toRequiredBoolean: jest.fn((value: unknown) => value),
                    } as never,
                    {
                        log
                    } as never,
                )

                await expect(service.parseManyWithTranslations()).resolves.toEqual([])
                expect(load).toHaveBeenCalledTimes(7)
                expect(log).toHaveBeenCalledTimes(7)
            })

        it("orders multiple valid models by their derived weight",
            async () => {
                const model = (name: string, price: number) => ({
                    name,
                    provider: ModelProvider.OpenAI,
                    category: AiModelCategory.Low,
                    keysFilePath: `keys/${name}`,
                    priority: 1,
                    priceInUsdPerMTok: price,
                    priceOutUsdPerMTok: price,
                    contextWindowTokens: 1000,
                    enabled: true,
                    complimentary: false,
                    supportedTasks: "chatting",
                    label: name,
                    description: name,
                })
                const extract = jest.fn()
                    .mockReturnValueOnce(model("expensive",
                        2))
                    .mockReturnValueOnce({
                        label: "", description: ""
                    })
                    .mockReturnValueOnce(model("cheap",
                        1))
                    .mockReturnValueOnce({
                        label: "", description: ""
                    })
                const service = new AiModelCatalogParserService(
                    {
                        paths: jest.fn().mockResolvedValue([
                            {
                                relativePath: "0-expensive", displayId: "expensive", orderIndex: 0
                            },
                            {
                                relativePath: "1-cheap", displayId: "cheap", orderIndex: 1
                            },
                        ]),
                    } as never,
                    {
                        load: jest.fn().mockResolvedValue("markdown")
                    } as never,
                    {
                        extract
                    } as never,
                    new CoerceMdScalarService(),
                    {
                        log: jest.fn()
                    } as never,
                )

                await expect(service.parseMany()).resolves.toEqual([
                    expect.objectContaining({
                        name: "cheap"
                    }),
                    expect.objectContaining({
                        name: "expensive"
                    }),
                ])
            })
    })
