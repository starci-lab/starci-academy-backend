import fs from "node:fs/promises"
import {
    ContextType,
} from "@modules/platform/env/enums/context"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    FilesystemContextService,
} from "./filesystem.service"

jest.mock("node:fs/promises",
    () => ({
        readFile: jest.fn(),
    }))
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))
jest.mock("@modules/filesystem/utils/mount-seed",
    () => ({
        getRuntimeContextRoot: jest.fn().mockReturnValue(null),
    }))

describe("FilesystemContextService",
    () => {
        const logger = {
            log: jest.fn(),
        }
        const service = new FilesystemContextService(logger as never)

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("reads a configured filesystem context and logs the successful path",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [{
                        index: 1,
                        type: ContextType.Filesystem,
                        path: "D:/contexts",
                    }],
                } as never)
                jest.mocked(fs.readFile).mockResolvedValue("markdown" as never)

                await expect(service.load(1,
                    "courses",
                    "intro.md")).resolves.toBe("markdown")
                expect(fs.readFile).toHaveBeenCalledWith(
                    "D:/contexts/courses/intro.md",
                    "utf8",
                )
                expect(logger.log).toHaveBeenCalled()
            })

        it("returns null for an unknown context or a non-filesystem definition",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [],
                } as never)
                await expect(service.load(9,
                    "x",
                    "y")).resolves.toBeNull()

                jest.mocked(envConfig).mockReturnValue({
                    contexts: [{
                        index: 2,
                        type: ContextType.S3,
                    }],
                } as never)
                await expect(service.load(2,
                    "x",
                    "y")).resolves.toBeNull()
                expect(fs.readFile).not.toHaveBeenCalled()
            })

        it("returns null when the configured file cannot be read",
            async () => {
                jest.mocked(envConfig).mockReturnValue({
                    contexts: [{
                        index: 1,
                        type: ContextType.Filesystem,
                        path: "D:/contexts",
                    }],
                } as never)
                jest.mocked(fs.readFile).mockRejectedValue(new Error("missing"))

                await expect(service.load(1,
                    "courses",
                    "missing.md")).resolves.toBeNull()
                expect(logger.log).not.toHaveBeenCalled()
            })
    })
