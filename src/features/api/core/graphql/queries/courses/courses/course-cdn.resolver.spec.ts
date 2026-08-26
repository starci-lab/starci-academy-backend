import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    CourseCdnResolver,
} from "./course-cdn.resolver"

describe("CourseCdnResolver",
    () => {
        it.each([
            [null,
                null],
            ["https://cdn.example/course.json",
                "https://cdn.example/course.json"],
        ])("returns %s directly when no signing is needed",
            async (stored, expected) => {
                const buildSignedGetObjectUrl = jest.fn()
                const result = await new CourseCdnResolver({
                    buildSignedGetObjectUrl,
                } as never).cdnUrl({
                    cdnUrl: stored,
                } as never)

                expect(result).toBe(expected)
                expect(buildSignedGetObjectUrl).not.toHaveBeenCalled()
            })

        it("signs a private object key with the Minio provider",
            async () => {
                const buildSignedGetObjectUrl = jest.fn().mockResolvedValue("https://signed.example")

                await expect(new CourseCdnResolver({
                    buildSignedGetObjectUrl,
                } as never).cdnUrl({
                    cdnUrl: "courses/course.json",
                } as never)).resolves.toBe("https://signed.example")
                expect(buildSignedGetObjectUrl).toHaveBeenCalledWith({
                    key: "courses/course.json",
                    provider: S3Provider.Minio,
                })
            })
    })
