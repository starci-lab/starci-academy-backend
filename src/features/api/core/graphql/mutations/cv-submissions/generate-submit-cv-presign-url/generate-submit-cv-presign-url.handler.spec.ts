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
    S3BuildService,
} from "@modules/s3"
import {
    NotAllowExtensionsException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"
import {
    GenerateSubmitCvPresignUrlCommand,
} from "./generate-submit-cv-presign-url.command"
import {
    GenerateSubmitCvPresignUrlHandler,
} from "./generate-submit-cv-presign-url.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("GenerateSubmitCvPresignUrlHandler",
    () => {
        let module: TestingModule
        let handler: GenerateSubmitCvPresignUrlHandler
        let entityManager: EntityManagerMock
        let s3BuildService: jest.Mocked<Pick<S3BuildService, "buildSignedPutObjectUrl">>

        beforeEach(async () => {
            // fresh jest-backed entity manager — `transaction` runs the callback inline
            entityManager = makeEntityManagerMock()

            // presigned-URL builder — returns a fixed signed PUT URL
            s3BuildService = {
                buildSignedPutObjectUrl: jest.fn().mockResolvedValue("https://minio/signed-put"),
            } as unknown as jest.Mocked<Pick<S3BuildService, "buildSignedPutObjectUrl">>

            module = await Test.createTestingModule({
                providers: [
                    GenerateSubmitCvPresignUrlHandler,
                    {
                        provide: S3BuildService,
                        useValue: s3BuildService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<GenerateSubmitCvPresignUrlHandler>(GenerateSubmitCvPresignUrlHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("rejects a non-pdf extension before any URL or DB work",
            async () => {
                await expect(
                    handler.execute(
                        new GenerateSubmitCvPresignUrlCommand({
                            request: {
                                fileName: "resume.docx",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(NotAllowExtensionsException)

                // the disallowed extension short-circuits before signing / persistence
                expect(s3BuildService.buildSignedPutObjectUrl).not.toHaveBeenCalled()
                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("signs a per-user pdf key and creates a new pending submission",
            async () => {
                // no prior submission for this user → a new row is created
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new GenerateSubmitCvPresignUrlCommand({
                        request: {
                            fileName: "My Resume.pdf",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the signed key is scoped to the user and keeps the pdf extension
                expect(s3BuildService.buildSignedPutObjectUrl).toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: "users/cv-submissions/user-1/My Resume.pdf",
                        contentType: "application/pdf",
                    }),
                )
                // a new submission is created and saved inside the transaction
                expect(entityManager.create).toHaveBeenCalled()
                expect(entityManager.save).toHaveBeenCalled()
                // the signed URL is returned to the client
                expect(result.url).toBe("https://minio/signed-put")
            })

        it("reuses the latest submission and re-points it at the new key",
            async () => {
                // an existing submission is found → it is repointed, not recreated
                const existing = {
                    id: "cv-1",
                    status: "uploaded",
                    cdnKey: "old-key",
                }
                entityManager.findOne.mockResolvedValueOnce(existing)

                const result = await handler.execute(
                    new GenerateSubmitCvPresignUrlCommand({
                        request: {
                            fileName: "resume.pdf",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the existing row is reset to pending + given the new key
                expect(entityManager.create).not.toHaveBeenCalled()
                expect(existing.cdnKey).toBe("users/cv-submissions/user-1/resume.pdf")
                expect(result.cvSubmissionId).toBe("cv-1")
            })
    })
