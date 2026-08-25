const page = {
    goto: jest.fn(), evaluate: jest.fn() 
}
const browser = {
    newPage: jest.fn().mockResolvedValue(page), close: jest.fn() 
}
jest.mock("puppeteer-extra",
    () => ({
        use: jest.fn(), launch: jest.fn().mockResolvedValue(browser) 
    }))
jest.mock("puppeteer-extra-plugin-stealth",
    () => jest.fn(() => ({
    })))
import {
    NextJsQueryService 
} from "./nextjs-query.service"

describe("NextJsQueryService",
    () => {
        it("launches, registers pages and builds GET query paths",
            async () => {
                const service = new NextJsQueryService(); await service.onModuleInit(); await service.addPage("https://example.test")
                expect(page.goto).toHaveBeenCalledWith("https://example.test",
                    {
                        waitUntil: "networkidle2" 
                    })
                page.evaluate.mockResolvedValue({
                    ok: true 
                }); await expect(service.get({
                    baseUrl: "https://example.test", path: "/api", params: {
                        page: 2 
                    } 
                })).resolves.toEqual({
                    ok: true 
                })
                expect(page.evaluate).toHaveBeenCalledWith(expect.any(Function),
                    "/api?page=2")
                await service.onModuleDestroy(); expect(browser.close).toHaveBeenCalled()
            })
        it("rejects requests for unregistered pages",
            async () => { await expect(new NextJsQueryService().get({
                baseUrl: "missing", path: "/x" 
            })).rejects.toThrow() })
    })
