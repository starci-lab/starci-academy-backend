import {
    PlaygroundParserService 
} from "./playground.service"
describe("PlaygroundParserService",
    () => { it("returns no playgrounds when its path index is empty",
        async () => { const service = new PlaygroundParserService({
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
} as never,
{
} as never,
{
    log: jest.fn() 
} as never,
{
} as never,
{
} as never); await expect(service.parseMany({
            courseRelativePath: "1-course", courseIndex: 1, courseId: "c1" 
        })).resolves.toEqual([]) }) })
