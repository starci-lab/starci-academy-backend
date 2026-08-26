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

    it("returns zero for empty or already synchronized Elasticsearch and CDN sets",
        async () => {
            const elasticsearch = {
                countDocs: jest.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(4),
                pruneOrphans: jest.fn(),
            }
            const s3Read = {
                listAll: jest.fn()
                    .mockResolvedValueOnce([])
                    .mockResolvedValueOnce(["assets/live.json"]),
            }
            const s3Delete = {
                deleteObjects: jest.fn(),
            }
            const service = new ReconcileSynchronizerService({
            } as never,
                elasticsearch as never,
                s3Read as never,
                s3Delete as never,
                {
                    log: jest.fn(),
                } as never)
            const internal = service as unknown as {
                pruneElasticsearch: (entity: string, locale: string, ids: Array<string>, ratio: number) => Promise<number>
                pruneCdn: (prefix: string, live: Set<string>, ratio: number) => Promise<number>
            }

            await expect(internal.pruneElasticsearch("CourseEntity",
                "vi",
                [],
                0.5)).resolves.toBe(0)
            await expect(internal.pruneElasticsearch("CourseEntity",
                "en",
                ["a",
                    "b",
                    "c",
                    "d"],
                0.5)).resolves.toBe(0)
            await expect(internal.pruneCdn("assets/",
                new Set(["live"]),
                0.5)).resolves.toBe(0)
            await expect(internal.pruneCdn("assets/",
                new Set(["live.json"]),
                0.5)).resolves.toBe(0)
            expect(elasticsearch.pruneOrphans).not.toHaveBeenCalled()
            expect(s3Delete.deleteObjects).not.toHaveBeenCalled()
        })

    it("deletes a safe Elasticsearch orphan and skips an unsafe CDN wipe",
        async () => {
            const elasticsearch = {
                countDocs: jest.fn().mockResolvedValue(10),
                pruneOrphans: jest.fn().mockResolvedValue(2),
            }
            const s3Read = {
                listAll: jest.fn().mockResolvedValue([
                    "assets/orphan-1.json",
                    "assets/orphan-2.json",
                    "assets/live.json",
                ]),
            }
            const s3Delete = {
                deleteObjects: jest.fn(),
            }
            const logger = {
                log: jest.fn(),
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

            await expect(internal.pruneElasticsearch("CourseEntity",
                "en",
                [
                    "live-1",
                    "live-2",
                    "live-3",
                    "live-4",
                    "live-5",
                    "live-6",
                    "live-7",
                    "live-8",
                    "live-9",
                ],
                0.2)).resolves.toBe(2)
            expect(elasticsearch.pruneOrphans).toHaveBeenCalledWith(expect.objectContaining({
                entity: "CourseEntity",
                locale: "en",
            }))

            await expect(internal.pruneCdn("assets/",
                new Set(["live"]),
                0.2)).resolves.toBe(0)
            expect(s3Delete.deleteObjects).not.toHaveBeenCalled()
        })

    it("reconciles all target collections and reports aggregate zero work",
        async () => {
            jest.mocked(envConfig).mockReturnValue({
                services: {
                    synchronizer: {
                        pruneOrphans: true,
                        pruneMaxRatio: 0.5,
                    },
                },
            } as ReturnType<typeof envConfig>)
            const manager = {
                getRepository: jest.fn().mockReturnValue({
                    find: jest.fn().mockResolvedValue([]),
                }),
            }
            const elasticsearch = {
                countDocs: jest.fn().mockResolvedValue(0),
                pruneOrphans: jest.fn(),
            }
            const s3Read = {
                listAll: jest.fn().mockResolvedValue([]),
            }
            const logger = {
                log: jest.fn(),
            }
            await new ReconcileSynchronizerService(manager as never,
                elasticsearch as never,
                s3Read as never,
                {
                    deleteObjects: jest.fn(),
                } as never,
                logger as never).reconcile()

            expect(manager.getRepository).toHaveBeenCalled()
            expect(logger.log).toHaveBeenCalled()
            expect(logger.log.mock.calls.at(-1)?.[1]).toEqual({
                elasticsearchDeleted: 0,
                cdnDeleted: 0,
            })
        })
    })
