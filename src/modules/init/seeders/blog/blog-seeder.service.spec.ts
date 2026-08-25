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
} as never); await expect(service.seed()).resolves.toBeUndefined(); expect(paths).not.toHaveBeenCalled() })
    it("does not load content when the enabled blog mount is empty",
        async () => { const paths = jest.fn().mockResolvedValue([]); const loader = jest.fn(); const service = new BlogSeederService({
        } as never,
{
    isBlogSeederEnabled: jest.fn().mockReturnValue(true)
} as never,
{
    filePaths: paths
} as never,
{
    load: loader
} as never,
{
} as never,
{
} as never); await expect(service.seed()).resolves.toBeUndefined(); expect(paths).toHaveBeenCalledWith("blog",
            ""); expect(loader).not.toHaveBeenCalled() }) })
