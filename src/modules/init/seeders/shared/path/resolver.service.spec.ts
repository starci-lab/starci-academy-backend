import {
    PathResolverService 
} from "./resolver.service"
import {
    ContextType 
} from "@modules/platform/env/enums/context"
import {
    envConfig 
} from "@modules/platform/env/config"
import fs from "node:fs/promises"
jest.mock("node:fs/promises")
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn() 
    }))
describe("PathResolverService",
    () => {
        it("filters indexed filesystem entries and maps order/display ids",
            async () => { jest.mocked(envConfig).mockReturnValue({
                contexts: [{
                    enabled: true, priority: 1, type: ContextType.Filesystem, path: "root" 
                }] 
            } as ReturnType<typeof envConfig>); jest.mocked(fs.readdir).mockResolvedValue(["README.md",
                "2-beta",
                "1-alpha",
                ".gitkeep"] as never); const result = await new PathResolverService({
                    list: jest.fn() 
                } as never).filePaths("courses",
                "contents"); expect(result).toEqual([{
                relativePath: "contents/2-beta", orderIndex: 2, displayId: "beta" 
            },
            {
                relativePath: "contents/1-alpha", orderIndex: 1, displayId: "alpha" 
            }]) })
        it("falls through failed/empty contexts and returns raw S3 entries",
            async () => { jest.mocked(envConfig).mockReturnValue({
                contexts: [{
                    enabled: true, priority: 1, type: ContextType.Filesystem, path: "root" 
                },
                {
                    enabled: true, priority: 2, type: ContextType.S3, provider: "minio" 
                }] 
            } as ReturnType<typeof envConfig>); jest.mocked(fs.readdir).mockRejectedValue(new Error("missing")); const list = jest.fn().mockResolvedValue(["flow-a.md"]); await expect(new PathResolverService({
                list 
            } as never).listRaw("courses",
                "flows")).resolves.toEqual(["flow-a.md"]); expect(list).toHaveBeenCalled() })
    })
