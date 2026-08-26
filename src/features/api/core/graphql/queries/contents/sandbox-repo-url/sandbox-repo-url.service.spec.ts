import {
    SandboxRepoUrlService
} from "./sandbox-repo-url.service"
import {
    ContentNotFoundException
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    ContentNotSandboxException
} from "@modules/platform/exceptions/errors/courses/content-not-sandbox"
describe("SandboxRepoUrlService",
    () => {
        const manager = {
            findOne: jest.fn()
        }
        const build = {
            buildSignedGetObjectUrl: jest.fn().mockResolvedValue("signed-url")
        }
        const names = {
            repo: jest.fn(() => "repo-key")
        }
        const service = new SandboxRepoUrlService(manager as never,
build as never,
names as never)
        beforeEach(() => jest.clearAllMocks())
        it("rejects missing and non-sandbox content",
            async () => {
                manager.findOne.mockResolvedValueOnce(null)
                await expect(service.execute({
                    contentId: "c"
                } as never,
{
    id: "u"
} as never)).rejects.toBeInstanceOf(ContentNotFoundException)
                manager.findOne.mockResolvedValueOnce({
                    isSandbox: false
                })
                await expect(service.execute({
                    contentId: "c"
                } as never,
{
    id: "u"
} as never)).rejects.toBeInstanceOf(ContentNotSandboxException)
            })
        it("builds a Minio URL for an accessible sandbox",
            async () => {
                manager.findOne.mockResolvedValue({
                    isSandbox: true, isPremium: false, githubBaseUrl: "https://github.com/org/repo", githubDir: "src", module: {
                        course: {
                            id: "course"
                        }
                    }
                })
                await expect(service.execute({
                    contentId: "c"
                } as never,
{
    id: "u"
} as never)).resolves.toBe("signed-url")
                expect(names.repo).toHaveBeenCalledWith("repo",
                    "src")
                expect(build.buildSignedGetObjectUrl).toHaveBeenCalled()
            })
    })
