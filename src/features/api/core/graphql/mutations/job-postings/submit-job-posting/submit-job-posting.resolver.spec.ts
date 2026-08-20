import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    JobPostingEntity,
} from "@modules/databases/postgresql/primary/entities/job-posting.entity"
import {
    JobApplyMethod,
} from "@modules/databases/postgresql/primary/enums/job-apply-method"
import {
    JobPostingSource,
} from "@modules/databases/postgresql/primary/enums/job-posting-source"
import {
    JobPostingInvalidRequestReason,
} from "@modules/platform/exceptions/errors/job-postings/job-posting-invalid-request"
import {
    HeadhuntingCompanyNotFoundException,
} from "@modules/platform/exceptions/errors/courses/headhunting-company-not-found"
import {
    JobPostingSlugGenerationFailedException,
} from "@modules/platform/exceptions/errors/job-postings/job-posting-slug-generation-failed"
import {
    SubmitJobPostingResolver,
} from "./submit-job-posting.resolver"

const request = (
    overrides: Record<string, unknown> = {
    },
): Record<string, unknown> => ({
    title: "Senior Backend Engineer",
    description: "Build reliable APIs.",
    requirements: "Node.js and PostgreSQL",
    location: "Remote",
    workMode: "remote",
    employmentType: "full_time",
    salaryMin: 1000,
    salaryMax: 2000,
    applyMethod: JobApplyMethod.ExternalUrl,
    applyUrl: "https://jobs.example.test/apply",
    applyEmail: undefined,
    companyId: "company-1",
    newCompany: undefined,
    ...overrides,
})

const user = {
    id: "user-1",
}

describe("SubmitJobPostingResolver — request validation",
    () => {
        const resolver = new SubmitJobPostingResolver(undefined as never)

        it.each([
            [
                "missing company",
                request({
                    companyId: undefined, newCompany: undefined 
                }),
                JobPostingInvalidRequestReason.MissingCompany,
            ],
            [
                "ambiguous company",
                request({
                    newCompany: {
                        title: "Acme" 
                    } 
                }),
                JobPostingInvalidRequestReason.AmbiguousCompany,
            ],
            [
                "missing external URL",
                request({
                    applyUrl: undefined 
                }),
                JobPostingInvalidRequestReason.MissingApplyUrl,
            ],
            [
                "missing email",
                request({
                    applyMethod: JobApplyMethod.Email, applyEmail: undefined 
                }),
                JobPostingInvalidRequestReason.MissingApplyEmail,
            ],
        ])("rejects %s before opening a transaction",
            async (_name, input, reason) => {
                const entityManager = {
                    transaction: jest.fn(),
                }
                const guardedResolver = new SubmitJobPostingResolver(entityManager as never)

                await expect(guardedResolver.execute(input as never,
            user as never)).rejects.toMatchObject({
                    metadata: expect.objectContaining({
                        reason 
                    }),
                })
                expect(entityManager.transaction).not.toHaveBeenCalled()
            })

        it("accepts internal apply without an external target",
            async () => {
                const validateApplyMethod = (resolver as unknown as {
            validateApplyMethod: (params: {
                applyMethod: JobApplyMethod
                applyUrl?: string
                applyEmail?: string
            }) => void
        }).validateApplyMethod

                expect(() => validateApplyMethod({
                    applyMethod: JobApplyMethod.Internal,
                    applyUrl: undefined,
                    applyEmail: undefined,
                })).not.toThrow()
            })
    })

describe("SubmitJobPostingResolver — persistence",
    () => {
        it("attaches an existing company and persists a submitted posting atomically",
            async () => {
                const company = {
                    id: "company-1" 
                }
                const transactionManager = {
                    findOneBy: jest.fn((entity: unknown) => {
                        if (entity === HeadhuntingCompanyEntity) {
                            return Promise.resolve(company)
                        }
                        return Promise.resolve(null)
                    }),
                    save: jest.fn((entity: unknown, value: Record<string, unknown>) => entity === JobPostingEntity
                        ? Promise.resolve({
                            ...value, id: "posting-1" 
                        })
                        : Promise.resolve(value)),
                }
                const entityManager = {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<unknown>) => callback(transactionManager)),
                }
                const resolver = new SubmitJobPostingResolver(entityManager as never)

                await expect(resolver.execute(request() as never,
            user as never)).resolves.toBe("posting-1")
                expect(transactionManager.save).toHaveBeenCalledWith(
                    JobPostingEntity,
                    expect.objectContaining({
                        title: "Senior Backend Engineer",
                        displayId: "senior-backend-engineer",
                        requirements: "Node.js and PostgreSQL",
                        source: JobPostingSource.Submitted,
                        company,
                        postedByUser: user,
                    }),
                )
            })

        it("creates an inline company and preserves nullable request fields",
            async () => {
                const company = {
                    id: "company-new" 
                }
                const transactionManager = {
                    findOneBy: jest.fn().mockResolvedValue(null),
                    save: jest.fn((entity: unknown, value: Record<string, unknown>) => entity === HeadhuntingCompanyEntity
                        ? Promise.resolve({
                            ...value, ...company 
                        })
                        : Promise.resolve({
                            ...value, id: "posting-new" 
                        })),
                }
                const entityManager = {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<unknown>) => callback(transactionManager)),
                }
                const resolver = new SubmitJobPostingResolver(entityManager as never)

                await expect(resolver.execute(request({
                    companyId: undefined,
                    newCompany: {
                        title: "New Co",
                        websiteUrl: "https://new.example.test",
                    },
                    requirements: undefined,
                    location: undefined,
                    workMode: undefined,
                    employmentType: undefined,
                    salaryMin: undefined,
                    salaryMax: undefined,
                    applyMethod: JobApplyMethod.Email,
                    applyUrl: undefined,
                    applyEmail: "jobs@new.example.test",
                }) as never,
        user as never)).resolves.toBe("posting-new")
                expect(transactionManager.save).toHaveBeenNthCalledWith(1,
                    HeadhuntingCompanyEntity,
                    expect.objectContaining({
                        title: "New Co",
                        displayId: "new-co",
                        websiteUrl: "https://new.example.test",
                        logoUrl: null,
                        defaultLocale: "vi",
                    }))
                expect(transactionManager.save).toHaveBeenNthCalledWith(2,
                    JobPostingEntity,
                    expect.objectContaining({
                        requirements: null,
                        location: null,
                        salaryMin: null,
                        salaryMax: null,
                        applyUrl: null,
                        applyEmail: "jobs@new.example.test",
                    }))
            })

        it("raises a typed company-not-found error inside the transaction",
            async () => {
                const transactionManager = {
                    findOneBy: jest.fn().mockResolvedValue(null),
                    save: jest.fn(),
                }
                const entityManager = {
                    transaction: jest.fn(async (callback: (manager: unknown) => Promise<unknown>) => callback(transactionManager)),
                }
                const resolver = new SubmitJobPostingResolver(entityManager as never)

                await expect(resolver.execute(request() as never,
            user as never)).rejects.toThrow(HeadhuntingCompanyNotFoundException)
                expect(transactionManager.save).not.toHaveBeenCalled()
            })
    })

describe("SubmitJobPostingResolver — slug generation",
    () => {
    type SlugGenerator = (
        manager: unknown,
        title: string,
        entity?: typeof JobPostingEntity,
    ) => Promise<string>

    const generate = (
        resolver: SubmitJobPostingResolver,
        manager: unknown,
        title: string,
    ) => (resolver as unknown as { generateUniqueSlug: SlugGenerator }).generateUniqueSlug(
        manager,
        title,
    )

    it("falls back for punctuation-only titles and retries a collision with a random suffix",
        async () => {
            const entityManager = {
                findOneBy: jest.fn()
                    .mockResolvedValueOnce({
                        id: "existing" 
                    })
                    .mockResolvedValueOnce(null),
            }
            const resolver = new SubmitJobPostingResolver(undefined as never)

            await expect(generate(resolver,
                entityManager,
                "!!!")).resolves.toMatch(/^listing-[0-9a-f]{6}$/)
            expect(entityManager.findOneBy).toHaveBeenCalledTimes(2)
        })

    it("fails loudly after all bounded suffix candidates collide",
        async () => {
            const entityManager = {
                findOneBy: jest.fn().mockResolvedValue({
                    id: "existing" 
                }),
            }
            const resolver = new SubmitJobPostingResolver(undefined as never)

            await expect(generate(resolver,
                entityManager,
                "Repeated title")).rejects.toThrow(JobPostingSlugGenerationFailedException)
            expect(entityManager.findOneBy).toHaveBeenCalledTimes(11)
        })
    })
