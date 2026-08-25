import {
    AiModelCatalogParserService 
} from "./ai-model-catalog.parser"
describe("AiModelCatalogParserService",
    () => { it("skips unreadable entries and returns an empty catalog",
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
} as never); await expect(service.parseManyWithTranslations()).resolves.toEqual([]); expect(load).toHaveBeenCalled() }) })
