import {
    FoundationCategoryParserService 
} from "./foundation-category.service"
import {
    FoundationCategoryPathNotFoundException 
} from "@modules/platform/exceptions/errors/courses/foundation-category-path-not-found"
describe("FoundationCategoryParserService",
    () => { it("rejects an unknown category path",
        async () => { const service = new FoundationCategoryParserService({
            extract: jest.fn() 
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
} as never,
{
} as never); await expect(service.parse({
            paths: [], categoryIndex: 9 
        })).rejects.toThrow(FoundationCategoryPathNotFoundException) }) })
