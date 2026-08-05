import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    HeadhuntingCompanyEntity,
    InjectPrimaryPostgreSQLEntityManager,
    JobApplyMethod,
    JobPostingEntity,
    JobPostingSource,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    HeadhuntingCompanyNotFoundException,
    JobPostingInvalidRequestException,
    JobPostingInvalidRequestReason,
    JobPostingSlugGenerationFailedException,
} from "@modules/exceptions"
import {
    SubmitJobPostingRequest,
    SubmitJobPostingResponse,
} from "./graphql-types"
import {
    MAX_SLUG_ATTEMPTS,
    SLUG_SUFFIX_LENGTH,
} from "./constants"
import {
    slugify,
} from "./utils"
import type {
    ValidateApplyMethodParams,
    ValidateCompanySelectionParams,
} from "./types"

@Resolver()
/**
 * Submit a job posting through the public form. Every row created here is
 * `source = Submitted` and goes live immediately -- there is no
 * approve/reject workflow for v1 (mirrors `pinExternalProject`).
 *
 * Auth is required only so the submission can be attributed to a user
 * (`postedByUserId`); no special role/company account is needed.
 */
export class SubmitJobPostingResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Job posting submitted successfully",
        [Locale.Vi]: "Đăng tin tuyển dụng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitJobPostingResponse,
        {
            name: "submitJobPosting",
            description: "Submit a job posting via the public form; goes live immediately (no approval workflow).",
        },
    )
    async execute(
        @Args("request")
            request: SubmitJobPostingRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<string> {
        // pull out the request fields once for readability
        const {
            title,
            description,
            requirements,
            location,
            workMode,
            employmentType,
            salaryMin,
            salaryMax,
            applyMethod,
            applyUrl,
            applyEmail,
            companyId,
            newCompany,
        } = request

        // enforce "exactly one of companyId / newCompany" -- a cross-field
        // invariant `class-validator` field decorators cannot express
        this.validateCompanySelection({
            companyId,
            newCompany,
        })

        // enforce "applyUrl required for ExternalUrl, applyEmail required for
        // Email" -- same reason, cross-field
        this.validateApplyMethod({
            applyMethod,
            applyUrl,
            applyEmail,
        })

        // resolving/creating the company and inserting the posting must be
        // atomic: a failed posting insert must not leave an orphan company row
        const saved = await this.entityManager.transaction(
            async (entityManager) => {
                // resolve the employer: either an existing company by id, or a
                // freshly created one from the inline newCompany payload
                const company = companyId
                    ? await this.resolveExistingCompany(
                        entityManager,
                        companyId,
                    )
                    : await this.createCompany(
                        entityManager,
                        newCompany!,
                    )

                // generate a unique slug from the title, retrying with a random
                // suffix on collision (rare, but titles are not unique)
                const displayId = await this.generateUniqueSlug(
                    entityManager,
                    title,
                )

                // persist the posting; every field is user-authored except
                // source (always Submitted for this mutation) and the
                // submitter, which is attributed from the auth guard
                return entityManager.save(JobPostingEntity,
                    {
                        title,
                        displayId,
                        description,
                        requirements: requirements ?? null,
                        location: location ?? null,
                        workMode: workMode ?? null,
                        employmentType: employmentType ?? null,
                        salaryMin: salaryMin ?? null,
                        salaryMax: salaryMax ?? null,
                        applyMethod,
                        applyUrl: applyUrl ?? null,
                        applyEmail: applyEmail ?? null,
                        source: JobPostingSource.Submitted,
                        expiresAt: null,
                        company,
                        postedByUser: user,
                    })
            },
        )

        // return the new posting id (interceptor wraps it as `data`)
        return saved.id
    }

    /**
     * Enforces that exactly one of `companyId` / `newCompany` was provided.
     *
     * @param params - The two mutually exclusive company fields from the request.
     */
    private validateCompanySelection(
        {
            companyId,
            newCompany,
        }: ValidateCompanySelectionParams,
    ): void {
        // neither provided -> we don't know who the employer is
        if (!companyId && !newCompany) {
            throw new JobPostingInvalidRequestException({
                reason: JobPostingInvalidRequestReason.MissingCompany,
            })
        }
        // both provided -> ambiguous, the caller must pick one path
        if (companyId && newCompany) {
            throw new JobPostingInvalidRequestException({
                reason: JobPostingInvalidRequestReason.AmbiguousCompany,
            })
        }
    }

    /**
     * Enforces that the field matching `applyMethod` was provided.
     *
     * @param params - The apply method plus its two possible targets.
     */
    private validateApplyMethod(
        {
            applyMethod,
            applyUrl,
            applyEmail,
        }: ValidateApplyMethodParams,
    ): void {
        if (applyMethod === JobApplyMethod.ExternalUrl && !applyUrl) {
            throw new JobPostingInvalidRequestException({
                reason: JobPostingInvalidRequestReason.MissingApplyUrl,
            })
        }
        if (applyMethod === JobApplyMethod.Email && !applyEmail) {
            throw new JobPostingInvalidRequestException({
                reason: JobPostingInvalidRequestReason.MissingApplyEmail,
            })
        }
    }

    /**
     * Loads an existing company by id, within the active transaction.
     *
     * @param entityManager - Transactional entity manager.
     * @param companyId - Id of the company to attach the posting to.
     * @returns The loaded company entity, used to set the `company` relation.
     */
    private async resolveExistingCompany(
        entityManager: EntityManager,
        companyId: string,
    ): Promise<HeadhuntingCompanyEntity> {
        // load explicitly (rather than passing a bare `{ id }` reference to
        // the relation) so a bad companyId surfaces as a typed, clear
        // "company not found" exception instead of a raw DB FK error
        const company = await entityManager.findOneBy(
            HeadhuntingCompanyEntity,
            {
                id: companyId,
            },
        )
        if (!company) {
            throw new HeadhuntingCompanyNotFoundException({
                id: companyId,
            })
        }
        return company
    }

    /**
     * Creates a brand-new employer company from the inline `newCompany`
     * payload, within the active transaction.
     *
     * @param entityManager - Transactional entity manager.
     * @param newCompany - Inline company payload from the request.
     * @returns The newly created company entity.
     */
    private async createCompany(
        entityManager: EntityManager,
        newCompany: NonNullable<SubmitJobPostingRequest["newCompany"]>,
    ): Promise<HeadhuntingCompanyEntity> {
        // a company created this way has no locale preference from the poster;
        // default to Vietnamese to match the platform's primary audience
        const displayId = await this.generateUniqueSlug(
            entityManager,
            newCompany.title,
            HeadhuntingCompanyEntity,
        )
        return entityManager.save(HeadhuntingCompanyEntity,
            {
                title: newCompany.title,
                displayId,
                description: null,
                websiteUrl: newCompany.websiteUrl ?? null,
                logoUrl: newCompany.logoUrl ?? null,
                address: null,
                phone: null,
                email: null,
                facebookUrl: null,
                linkedinUrl: null,
                orderIndex: 0,
                sortIndex: 0,
                defaultLocale: Locale.Vi,
            })
    }

    /**
     * Generates a unique `displayId` slug for either entity type this
     * mutation may insert, retrying with a random suffix on collision.
     *
     * @param entityManager - Transactional entity manager (uniqueness must be
     *   checked against the same transaction that will insert the row).
     * @param title - Free-text title to slugify.
     * @param entity - Which table's `displayId` uniqueness to check against;
     *   defaults to `JobPostingEntity`.
     * @returns A slug guaranteed unique for the given entity at call time.
     */
    private async generateUniqueSlug(
        entityManager: EntityManager,
        title: string,
        entity: typeof JobPostingEntity | typeof HeadhuntingCompanyEntity = JobPostingEntity,
    ): Promise<string> {
        // base slug from the title; an empty result (e.g. all-emoji title)
        // falls back to a generic base so we always have something to suffix
        const base = slugify(title) || "listing"

        // first try the bare slug -- the common case, no collision
        const existing = await entityManager.findOneBy(
            entity,
            {
                displayId: base,
            },
        )
        if (!existing) {
            return base
        }

        // collided (rare) -- append a short random hex suffix, retrying a
        // bounded number of times rather than looping forever
        for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
            const suffix = Math.random()
                .toString(16)
                .slice(2,
                    2 + SLUG_SUFFIX_LENGTH)
            const candidate = `${base}-${suffix}`
            const collision = await entityManager.findOneBy(
                entity,
                {
                    displayId: candidate,
                },
            )
            if (!collision) {
                return candidate
            }
        }

        // astronomically unlikely with a 6-hex-char suffix space, but fail
        // loudly rather than silently returning a colliding slug
        throw new JobPostingSlugGenerationFailedException({
            base,
            attempts: MAX_SLUG_ATTEMPTS,
        })
    }
}
