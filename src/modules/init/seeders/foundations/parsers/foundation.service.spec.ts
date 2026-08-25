import {
    FoundationParserService 
} from "./foundation.service"
describe("FoundationParserService",
    () => { it("skips missing paths in parseMany",
        async () => { const service = new FoundationParserService({
            extract: jest.fn() 
        } as never,
{
} as never,
{
    paths: jest.fn().mockResolvedValue([]) 
} as never,
{
} as never,
{
} as never,
{
} as never,
{
} as never,
{
    log: jest.fn() 
} as never); await expect(service.parseMany({
            categoryRelativePath: "1-category", categoryIndex: 1 
        })).resolves.toEqual([]) }) })
