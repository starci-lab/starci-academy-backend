// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    TaskHandler,
} from "./task.handler"
import {
    TaskQuery,
} from "./task.query"
import {
    Locale,
} from "@modules/databases"
import {
    MilestoneNotFoundException,
} from "@modules/exceptions"
import {
    S3NameResolverService,
    S3ReadService,
} from "@modules/s3"

describe("TaskHandler",
    () => {
        let module: TestingModule
        let handler: TaskHandler
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "json">>
        let s3NameResolverService: jest.Mocked<Pick<S3NameResolverService, "milestoneTask">>

        beforeEach(async () => {
            s3ReadService = {
                json: jest.fn(),
            } as unknown as jest.Mocked<Pick<S3ReadService, "json">>

            s3NameResolverService = {
                milestoneTask: jest.fn(
                    (id: string, locale?: Locale) =>
                        locale
                            ? `milestone-tasks/${id}/${locale}.json`
                            : `milestone-tasks/${id}.json`,
                ),
            } as unknown as jest.Mocked<Pick<S3NameResolverService, "milestoneTask">>

            module = await Test.createTestingModule({
                providers: [
                    TaskHandler,
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: S3NameResolverService,
                        useValue: s3NameResolverService,
                    },
                ],
            }).compile()

            handler = module.get<TaskHandler>(TaskHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("reads the localized task JSON from the CDN by id and requested locale",
            async () => {
                const task = {
                    id: "task-1",
                }
                ;(s3ReadService.json as jest.Mock).mockResolvedValueOnce(task)

                const result = await handler.execute(
                    new TaskQuery({
                        request: {
                            id: "task-1",
                        },
                        locale: Locale.Vi,
                    }),
                )

                expect(result).toBe(task)
                // resolved the per-locale CDN key with the requested locale
                expect(s3NameResolverService.milestoneTask).toHaveBeenCalledWith(
                    "task-1",
                    Locale.Vi,
                )
                expect(s3ReadService.json).toHaveBeenCalledWith({
                    key: "milestone-tasks/task-1/vi.json",
                    provider: expect.anything(),
                })
            })

        it("falls back to En when no locale is supplied",
            async () => {
                ;(s3ReadService.json as jest.Mock).mockResolvedValueOnce({
                    id: "task-2",
                })

                await handler.execute(
                    new TaskQuery({
                        request: {
                            id: "task-2",
                        },
                    }),
                )

                // missing request locale -> En
                expect(s3NameResolverService.milestoneTask).toHaveBeenCalledWith(
                    "task-2",
                    Locale.En,
                )
            })

        it("throws not-found when the CDN object is missing",
            async () => {
                ;(s3ReadService.json as jest.Mock).mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new TaskQuery({
                            request: {
                                id: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(MilestoneNotFoundException)
            })
    })
