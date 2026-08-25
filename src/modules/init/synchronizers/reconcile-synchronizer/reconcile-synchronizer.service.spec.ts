import {
    ReconcileSynchronizerService 
} from "./reconcile-synchronizer.service"
import {
    envConfig 
} from "@modules/platform/env/config"
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn() 
    }))
describe("ReconcileSynchronizerService",
    () => { it("does nothing when orphan pruning is disabled",
        async () => { jest.mocked(envConfig).mockReturnValue({
            services: {
                synchronizer: {
                    pruneOrphans: false, pruneMaxRatio: 0.2 
                } 
            } 
        } as ReturnType<typeof envConfig>); const es = {
            pruneOrphans: jest.fn() 
        }; const service = new ReconcileSynchronizerService({
        } as never,
es as never,
{
} as never,
{
} as never,
{
    log: jest.fn() 
} as never); await expect(service.reconcile()).resolves.toBeUndefined(); expect(es.pruneOrphans).not.toHaveBeenCalled() }) })
