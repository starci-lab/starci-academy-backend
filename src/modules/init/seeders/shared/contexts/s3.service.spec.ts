import {
    ContextType,
} from "@modules/platform/env/enums/context"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    S3ContextService,
} from "./s3.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn()
    }))

describe("S3ContextService",
    () => {
        const read = {
            text: jest.fn()
        }
        const logger = {
            log: jest.fn()
        }
        const service = new S3ContextService(read as never,
logger as never)

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("loads a configured S3 context and logs successful reads",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [{
                        index: 1, type: ContextType.S3, provider: S3Provider.Minio
                    }]
                } as unknown as ReturnType<typeof envConfig>)
                read.text.mockResolvedValue("body")

                await expect(service.load(1,
                    "courses",
                    "0/en.md")).resolves.toBe("body")
                expect(read.text).toHaveBeenCalledWith({
                    key: "courses/0/en.md", provider: S3Provider.Minio
                })
                expect(logger.log).toHaveBeenCalled()
            })

        it("returns null without logging when the object is absent",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [{
                        index: 1, type: ContextType.S3
                    }]
                } as unknown as ReturnType<typeof envConfig>)
                read.text.mockResolvedValue(null)

                await expect(service.load(1,
                    "courses",
                    "missing.md")).resolves.toBeNull()
                expect(logger.log).not.toHaveBeenCalled()
            })

        it("rejects unknown and non-S3 context definitions",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: []
                } as unknown as ReturnType<typeof envConfig>)
                await expect(service.load(9,
                    "x",
                    "y")).rejects.toThrow("S3 context not found")
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [{
                        index: 2, type: "local"
                    }]
                } as unknown as ReturnType<typeof envConfig>)
                await expect(service.load(2,
                    "x",
                    "y")).rejects.toThrow("S3 context type mismatch")
            })
    })
