import {
    RepoSynchronizerService 
} from "./repo-synchronizer.service"
import {
    envConfig 
} from "@modules/platform/env/config"
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn() 
    }))
describe("RepoSynchronizerService",
    () => { it("ensures public prefixes and exits when there are no repo-backed contents",
        async () => { jest.mocked(envConfig).mockReturnValue({
            s3: {
                minio: {
                    bucket: "academy" 
                } 
            } 
        } as ReturnType<typeof envConfig>); const findOne = jest.fn().mockResolvedValue(null); const bucket = {
            ensurePublicReadPrefixes: jest.fn().mockResolvedValue(undefined) 
        }; const service = new RepoSynchronizerService({
            now: jest.fn().mockReturnValue({
                diff: jest.fn().mockReturnValue(1) 
            }) 
        } as never,
{
    log: jest.fn() 
} as never,
{
    findOne 
} as never,
{
} as never,
{
} as never,
bucket as never); await expect(service.sync({
} as never)).resolves.toBeUndefined(); expect(bucket.ensurePublicReadPrefixes).toHaveBeenCalledWith("academy"); expect(findOne).toHaveBeenCalled() }) })
