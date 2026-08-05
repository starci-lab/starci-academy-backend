// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    S3BuildService,
} from "@modules/integrations/s3/s3-build.service"
import {
    NotAllowExtensionsException,
} from "@modules/platform/exceptions/errors/api/not-allow-extensions"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    GenerateSubmitCvPresignUrlCommand,
} from "./generate-submit-cv-presign-url.command"
import {
    GenerateSubmitCvPresignUrlHandler,
} from "./generate-submit-cv-presign-url.handler"

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
        let s3BuildService: jest.Mocked<Pick<S3BuildService, "buildSignedPutObjectUrl">>

        beforeEach(async () => {
            // presigned-URL builder -- returns a fixed signed PUT URL
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
                ],
            }).compile()

            handler = module.get<GenerateSubmitCvPresignUrlHandler>(GenerateSubmitCvPresignUrlHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("rejects a non-pdf extension before signing",
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

                // the disallowed extension short-circuits before signing
                expect(s3BuildService.buildSignedPutObjectUrl).not.toHaveBeenCalled()
            })

        it("signs a per-user pdf key and returns the url + cdn key",
            async () => {
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
                // the signed URL + object key are returned to the client (WF-07: the
                // client passes cdnKey into `uploadCv` to register it in cv_generations)
                expect(result.url).toBe("https://minio/signed-put")
                expect(result.cdnKey).toBe("users/cv-submissions/user-1/My Resume.pdf")
            })
    })
