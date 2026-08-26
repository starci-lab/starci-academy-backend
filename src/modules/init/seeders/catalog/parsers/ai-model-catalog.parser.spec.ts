import {
    AiModelCatalogParserService
} from "./ai-model-catalog.parser"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
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
    })
