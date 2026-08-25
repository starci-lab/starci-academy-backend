import {
    ConsultantParserService 
} from "./consultant.service"
import {
    ConsultantPathNotFoundException 
} from "@modules/platform/exceptions/errors/courses/consultant-path-not-found"
describe("ConsultantParserService",
    () => { it("rejects an unknown consultant index",
        async () => { const service = new ConsultantParserService({
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
} as never,
{
    log: jest.fn() 
} as never); await expect(service.parse({
            paths: [], consultantIndex: 4, companyIndex: 1 
        })).rejects.toThrow(ConsultantPathNotFoundException) }) })
