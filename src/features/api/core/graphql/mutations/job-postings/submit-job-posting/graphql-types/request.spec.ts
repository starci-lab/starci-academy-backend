import {
    plainToInstance
} from "class-transformer"
import {
    validate
} from "class-validator"
import {
    JobApplyMethod
} from "@modules/databases/postgresql/primary/enums/job-apply-method"
import {
    SubmitJobPostingRequest
} from "./request"

describe("SubmitJobPostingRequest validation",
    () => {
        it("accepts a valid URL application payload",
            async () => {
                const request = plainToInstance(SubmitJobPostingRequest,
                    {
                        title: "Engineer", description: "Build things", applyMethod: JobApplyMethod.ExternalUrl, applyUrl: "https://example.com/apply", salaryMin: 1, salaryMax: 2
                    })
                await expect(validate(request)).resolves.toEqual([])
                expect(request).toBeInstanceOf(SubmitJobPostingRequest)
            })
        it("rejects invalid required, enum, URL, and length constraints",
            async () => {
                const request = plainToInstance(SubmitJobPostingRequest,
                    {
                        title: 12, description: 12, workMode: "invalid", applyMethod: "invalid", applyEmail: "not-an-email", applyUrl: "not-a-url"
                    })
                const errors = await validate(request)
                expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(["title",
                    "description",
                    "workMode",
                    "applyMethod",
                    "applyEmail",
                    "applyUrl"]))
            })
    })
