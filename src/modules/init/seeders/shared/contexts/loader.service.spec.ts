import {
    ContextLoaderService
} from "./loader.service"
import {
    ContextType
} from "@modules/platform/env/enums/context"
import {
    ContextFileNotFoundException
} from "@modules/platform/exceptions/errors/courses/context-file-not-found"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))
import {
    envConfig
} from "@modules/platform/env/config"

describe("ContextLoaderService",
    () => {
        it("tries enabled contexts by priority and returns the first hit",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [
                        {
                            type: ContextType.Filesystem, index: 2, priority: 2, enabled: true
                        },
                        {
                            type: ContextType.S3, index: 1, priority: 1, enabled: true
                        },
                    ]
                } as never)
                const s3 = {
                    load: jest.fn().mockResolvedValue("from-s3")
                }
                const filesystem = {
                    load: jest.fn()
                }
                const service = new ContextLoaderService(s3 as never,
filesystem as never)
                await expect(service.load("courses",
                    "a.md")).resolves.toBe("from-s3")
                expect(s3.load).toHaveBeenCalledWith(1,
                    "courses",
                    "a.md")
                expect(filesystem.load).not.toHaveBeenCalled()
            })

        it("falls through misses and raises a contextual not-found error",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [
                        {
                            type: ContextType.S3, index: 1, priority: 1, enabled: true
                        },
                        {
                            type: ContextType.Filesystem, index: 2, priority: 2, enabled: true
                        },
                        {
                            type: ContextType.Filesystem, index: 3, priority: 3, enabled: false
                        },
                    ]
                } as never)
                const service = new ContextLoaderService({
                    load: jest.fn().mockResolvedValue(null)
                } as never,
{
    load: jest.fn().mockResolvedValue(null)
} as never)
                await expect(service.load("blog",
                    "missing.md")).rejects.toBeInstanceOf(ContextFileNotFoundException)
            })
    })
