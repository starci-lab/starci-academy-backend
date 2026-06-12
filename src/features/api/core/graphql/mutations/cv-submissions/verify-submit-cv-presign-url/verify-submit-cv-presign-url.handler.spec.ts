// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    S3ReadService,
} from "@modules/s3"
import {
    CvSubmissionStatus,
} from "@modules/databases"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    VerifySubmitCvPresignUrlCommand,
} from "./verify-submit-cv-presign-url.command"
import {
    VerifySubmitCvPresignUrlHandler,
} from "./verify-submit-cv-presign-url.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("VerifySubmitCvPresignUrlHandler",
    () => {
        let module: TestingModule
        let handler: VerifySubmitCvPresignUrlHandler
        let entityManager: EntityManagerMock
        let s3ReadService: jest.Mocked<Pick<S3ReadService, "exists">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // object-existence probe against the CDN
            s3ReadService = {
                exists: jest.fn(),
            } as unknown as jest.Mocked<Pick<S3ReadService, "exists">>

            module = await Test.createTestingModule({
                providers: [
                    VerifySubmitCvPresignUrlHandler,
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<VerifySubmitCvPresignUrlHandler>(VerifySubmitCvPresignUrlHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when the submission does not exist (no CDN probe)",
            async () => {
                // submission lookup finds nothing
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new VerifySubmitCvPresignUrlCommand({
                            request: {
                                cvSubmissionId: "missing",
                            },
                        }),
                    ),
                ).rejects.toThrow(/CV Submission not found/)

                expect(s3ReadService.exists).not.toHaveBeenCalled()
            })

        it("promotes a pending submission to uploaded when the object is present",
            async () => {
                // a pending submission with a cdn key whose object exists
                entityManager.findOne.mockResolvedValueOnce({
                    id: "cv-1",
                    cdnKey: "key-1",
                    status: CvSubmissionStatus.Pending,
                })
                s3ReadService.exists.mockResolvedValueOnce(true)

                const result = await handler.execute(
                    new VerifySubmitCvPresignUrlCommand({
                        request: {
                            cvSubmissionId: "cv-1",
                        },
                    }),
                )

                // the row is moved to uploaded and the caller sees uploaded=true
                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    "cv-1",
                    {
                        status: CvSubmissionStatus.Uploaded,
                    },
                )
                expect(result).toEqual({
                    uploaded: true,
                })
            })

        it("marks the submission failed when the object is absent",
            async () => {
                // a pending submission whose cdn object is missing
                entityManager.findOne.mockResolvedValueOnce({
                    id: "cv-1",
                    cdnKey: "key-1",
                    status: CvSubmissionStatus.Pending,
                })
                s3ReadService.exists.mockResolvedValueOnce(false)

                const result = await handler.execute(
                    new VerifySubmitCvPresignUrlCommand({
                        request: {
                            cvSubmissionId: "cv-1",
                        },
                    }),
                )

                // the row is moved to failed and the caller sees uploaded=false
                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    "cv-1",
                    {
                        status: CvSubmissionStatus.Failed,
                    },
                )
                expect(result).toEqual({
                    uploaded: false,
                })
            })

        it("reports uploaded without a status change when already past pending",
            async () => {
                // an already-uploaded submission whose object still exists
                entityManager.findOne.mockResolvedValueOnce({
                    id: "cv-1",
                    cdnKey: "key-1",
                    status: CvSubmissionStatus.Uploaded,
                })
                s3ReadService.exists.mockResolvedValueOnce(true)

                const result = await handler.execute(
                    new VerifySubmitCvPresignUrlCommand({
                        request: {
                            cvSubmissionId: "cv-1",
                        },
                    }),
                )

                // no redundant update when the status is already past pending
                expect(entityManager.update).not.toHaveBeenCalled()
                expect(result).toEqual({
                    uploaded: true,
                })
            })
    })
