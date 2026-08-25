import {
    TemplateCvParserService
} from "./template-cv.service"
describe("TemplateCvParserService",
    () => { it("returns null for an unknown template path",
        async () => { const service = new TemplateCvParserService({
            paths: jest.fn()
        } as never,
{
    load: jest.fn()
} as never,
{
    generate: jest.fn()
} as never,
{
    log: jest.fn()
} as never); await expect(service.parse({
            paths: [], templateIndex: 0
        })).resolves.toBeNull() }) })
