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
} as never); await expect(service.reconcile()).resolves.toBeUndefined(); expect(es.pruneOrphans).not.toHaveBeenCalled() })

    it("skips unsafe Elasticsearch pruning and deletes safe CDN orphans",
        async () => {
            jest.mocked(envConfig).mockReturnValue({
                services: {
                    synchronizer: {
                        pruneOrphans: true, pruneMaxRatio: 0.2
                    }
                }
            } as ReturnType<typeof envConfig>)
            const elasticsearch = {
                countDocs: jest.fn().mockResolvedValue(10), pruneOrphans: jest.fn()
            }
            const s3Read = {
                listAll: jest.fn().mockResolvedValue(["assets/live-1.json",
                    "assets/live-2.json",
                    "assets/live-3.json",
                    "assets/live-4.json",
                    "assets/orphan.json"])
            }
            const s3Delete = {
                deleteObjects: jest.fn().mockResolvedValue(1)
            }
            const logger = {
                log: jest.fn()
            }
            const service = new ReconcileSynchronizerService({
            } as never,
elasticsearch as never,
s3Read as never,
s3Delete as never,
logger as never)
            const internal = service as unknown as {
                pruneElasticsearch: (entity: string, locale: string, ids: Array<string>, ratio: number) => Promise<number>
                pruneCdn: (prefix: string, live: Set<string>, ratio: number) => Promise<number>
            }

            await expect(internal.pruneElasticsearch("ContentEntity",
                "en",
                ["only-one"],
                0.2)).resolves.toBe(0)
            expect(elasticsearch.pruneOrphans).not.toHaveBeenCalled()
            await expect(internal.pruneCdn("assets/",
                new Set(["live-1",
                    "live-2",
                    "live-3",
                    "live-4"]),
                0.2)).resolves.toBe(1)
            expect(s3Delete.deleteObjects).toHaveBeenCalled()
        })
    })
