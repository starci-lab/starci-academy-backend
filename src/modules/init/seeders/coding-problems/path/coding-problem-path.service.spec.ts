jest.mock("node:fs",
    () => ({
        existsSync: jest.fn(),
        readdirSync: jest.fn(),
    }))
jest.mock("@modules/filesystem/utils/mount-seed",
    () => ({
        getRuntimeContextRoot: jest.fn().mockReturnValue("/runtime-context"),
    }))

import {
    existsSync,
    readdirSync,
} from "node:fs"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem/utils/mount-seed"
import {
    join,
} from "node:path"
import {
    CodingProblemPathService,
} from "./coding-problem-path.service"

describe("CodingProblemPathService",
    () => {
        beforeEach(() => {
            jest.clearAllMocks()
            jest.mocked(getRuntimeContextRoot).mockReturnValue("/runtime-context")
        })

        it("uses the active runtime context root and builds derived paths",
            () => {
                const service = new CodingProblemPathService()

                expect(service.root()).toBe(join("/runtime-context",
                    "coding-problems"))
                expect(service.testcasesDir("/problem")).toBe(join("/problem",
                    "testcases"))
                expect(service.hintPath("/problem",
                    "vi")).toBe(join(
                    "/problem",
                    "hints",
                    "vi.md",
                ))
            })

        it("returns an empty list when the sets directory is absent",
            () => {
                jest.mocked(existsSync).mockReturnValue(false)
                const service = new CodingProblemPathService()

                expect(service.problemDirs()).toEqual([])
                expect(readdirSync).not.toHaveBeenCalled()
            })

        it("discovers problem directories from sets and sorts them stably",
            () => {
                jest.mocked(existsSync).mockReturnValue(true)
                jest.mocked(readdirSync)
                    .mockReturnValueOnce([
                        {
                            name: "set-a",
                            isDirectory: () => true,
                        },
                        {
                            name: "README.md",
                            isDirectory: () => false,
                        },
                    ] as never)
                    .mockReturnValueOnce([
                        {
                            name: "z-problem",
                            isDirectory: () => true,
                        },
                        {
                            name: "a-problem",
                            isDirectory: () => true,
                        },
                    ] as never)
                const service = new CodingProblemPathService()

                expect(service.problemDirs()).toEqual([
                    join("/runtime-context",
                        "coding-problems",
                        "sets",
                        "set-a",
                        "problems",
                        "a-problem"),
                    join("/runtime-context",
                        "coding-problems",
                        "sets",
                        "set-a",
                        "problems",
                        "z-problem"),
                ])
            })
    })
