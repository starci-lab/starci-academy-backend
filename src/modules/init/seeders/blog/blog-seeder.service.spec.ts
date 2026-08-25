import {
    BlogSeederService 
} from "./blog-seeder.service"
describe("BlogSeederService",
    () => { it("honors the disabled seeder gate",
        async () => { const paths = jest.fn(); const service = new BlogSeederService({
        } as never,
{
    isBlogSeederEnabled: jest.fn().mockReturnValue(false) 
} as never,
{
    filePaths: paths 
} as never,
{
} as never,
{
} as never,
{
} as never); await expect(service.seed()).resolves.toBeUndefined(); expect(paths).not.toHaveBeenCalled() }) })
