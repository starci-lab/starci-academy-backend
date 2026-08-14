// Side-effect import: fully load the elasticsearch barrel before the handler so
// the @modules/cqrs barrel resolves ICQRSHandler ahead of AbstractSuggestionsHandler
// (avoids a "Class extends value undefined" load-order cycle in the cqrs barrel).
import "@modules/integrations/elasticsearch/elasticsearch.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    CourseHandler,
} from "./course.handler"
import {
    CourseQuery,
} from "./course.query"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"

/** Minimal course entity stand-in -- only the id matters for assertions. */
const fakeCourse = (
    id: string,
): CourseEntity => ({
    id,
}) as unknown as CourseEntity

describe("CourseHandler",
    () => {
        let module: TestingModule
        let handler: CourseHandler
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "json">>
        let s3NameResolverService: jest.Mocked<Pick<S3NameResolverService, "course">>

        beforeEach(async () => {
            // S3 read returns the JSON document the test programs (null by default -> not found)
            s3ReadService = {
                json: jest.fn(),
            } as unknown as jest.Mocked<Pick<S3ReadService, "json">>

            // name resolver just echoes a deterministic object key the read service consumes
            s3NameResolverService = {
                course: jest.fn(() => "courses/course-1/vi.json"),
            } as unknown as jest.Mocked<Pick<S3NameResolverService, "course">>

            module = await Test.createTestingModule({
                providers: [
                    CourseHandler,
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

            handler = module.get<CourseHandler>(CourseHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("prefers displayId over id when both arrive, so a shared link and a card serve the same object",
            async () => {
                // program the S3 read to hand back a course document
                s3ReadService.json.mockResolvedValueOnce(fakeCourse("course-1"))

                const result = await handler.execute(
                    new CourseQuery({
                        request: {
                            id: "course-1",
                            displayId: "system-design",
                        },
                        locale: Locale.Vi,
                    }),
                )

                // the resolver is asked for the per-locale object key
                expect(s3NameResolverService.course).toHaveBeenCalledWith(
                    "system-design",
                    Locale.Vi,
                )
                expect(result.id).toBe("course-1")
            })

        it("resolves the object key by id when no displayId is given",
            async () => {
                // The synchronizer writes `courses/<id>/<locale>.json` for every entity as well as
                // the display-id key, so a primary key addresses a real object. This used to throw:
                // the handler assumed a key could not be built from an id, and the course catalog
                // links by primary key, so every card reached the not-found notice.
                s3ReadService.json.mockResolvedValueOnce(fakeCourse("course-1"))

                const result = await handler.execute(
                    new CourseQuery({
                        request: {
                            id: "course-1",
                        },
                        locale: Locale.En,
                    }),
                )

                expect(s3NameResolverService.course).toHaveBeenCalledWith(
                    "course-1",
                    Locale.En,
                )
                expect(result.id).toBe("course-1")
            })

        it("throws when the request carries neither identifier",
            async () => {
                await expect(
                    handler.execute(
                        new CourseQuery({
                            request: {
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(CourseNotFoundException)

                // never reaches the S3 read when there is nothing to build a key from
                expect(s3ReadService.json).not.toHaveBeenCalled()
            })

        it("throws when the S3 document is missing",
            async () => {
                // the read resolves null -> the course was never materialized in the bucket
                s3ReadService.json.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new CourseQuery({
                            request: {
                                id: "course-1",
                                displayId: "system-design",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(CourseNotFoundException)
            })
    })
