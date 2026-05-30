import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
    FindOptionsWhere,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeTranslationEntity,
    ChallengeRequirementV2Entity,
    ChallengeRequirementV2TranslationEntity,
    ChallengeStepV2Entity,
    ChallengeStepV2TranslationEntity,
    ChallengeOutputV2Entity,
    ChallengeOutputV2TranslationEntity,
    ChallengePrerequisiteV2Entity,
    ChallengePrerequisiteV2TranslationEntity,
    ChallengeReferenceEntity,
    ChallengeReferenceTranslationEntity,
    ChallengeSubmissionEntity,
    ChallengeSubmissionTranslationEntity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionPromptTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"
import {
    upsertChildrenWithTranslations,
} from "./challenge-insert.service"

/**
 * SCHEMA V2 challenge insert service. ADDITIVE counterpart to {@link ChallengeInsertService}:
 * it persists the same challenge / translations / references / submissions tables BUT routes the
 * requirement/step/output/prerequisite data into the V2 per-language jsonb bucket tables and sets
 * the `outcomeCriteria` / `approachCriteria` jsonb columns. Legacy V1 child tables are never
 * touched by this service.
 */
@Injectable()
export class ChallengeV2InsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single V2 challenge and ALL its V2 child / scalar-criteria / reference / submission
     * tables.
     *
     * @param challenge - V2 challenge graph produced by {@link ChallengeV2ParserService}.
     */
    async insert(
        challenge: DeepPartial<ChallengeEntity>,
    ): Promise<void> {
        const challengeId = challenge.id as string

        // strip nested relations; the challenge row itself keeps the two jsonb criteria columns
        const {
            translations,
            requirementsV2,
            outputsV2,
            prerequisitesV2,
            stepsV2,
            references,
            submissions,
            content,
            contentId,
            ...rest
        } = challenge as DeepPartial<ChallengeEntity>

        // re-attach the content FK as a relation object so TypeORM fills content_id
        const contentRef = content ?? (contentId ? {
            id: contentId,
        } : undefined)

        // 1. upsert the challenge row (includes outcomeCriteria / approachCriteria jsonb columns)
        await this.upsertService.upsertUuid(
            ChallengeEntity,
            [{
                ...rest,
                ...(contentRef ? {
                    content: contentRef,
                } : {
                }),
            }],
        )

        // 2. upsert challenge title/description translations
        if (translations) {
            await this.upsertService.upsertTranslation(
                ChallengeTranslationEntity,
                translations,
                {
                    challenge: {
                        id: challengeId,
                    },
                },
            )
        }

        // 3. upsert the four V2 per-language bucket tables + their per-locale translations
        const v2ParentFilter = {
            challenge: {
                id: challengeId,
            },
        }
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengeRequirementV2Entity,
            ChallengeRequirementV2TranslationEntity,
            requirementsV2 as Array<DeepPartial<ChallengeRequirementV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengeRequirementV2Entity>,
            "challengeRequirementV2Id",
        )
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengeStepV2Entity,
            ChallengeStepV2TranslationEntity,
            stepsV2 as Array<DeepPartial<ChallengeStepV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengeStepV2Entity>,
            "challengeStepV2Id",
        )
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengeOutputV2Entity,
            ChallengeOutputV2TranslationEntity,
            outputsV2 as Array<DeepPartial<ChallengeOutputV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengeOutputV2Entity>,
            "challengeOutputV2Id",
        )
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengePrerequisiteV2Entity,
            ChallengePrerequisiteV2TranslationEntity,
            prerequisitesV2 as Array<DeepPartial<ChallengePrerequisiteV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengePrerequisiteV2Entity>,
            "challengePrerequisiteV2Id",
        )

        // 4. upsert references + their alias translations (mirrors legacy reference handling)
        if (references?.length) {
            for (const reference of references) {
                const {
                    translations: referenceTranslations,
                    ...referenceData
                } = reference as DeepPartial<ChallengeReferenceEntity> & {
                    translations?: Array<DeepPartial<ChallengeReferenceTranslationEntity>>
                }
                await this.upsertService.upsertUuid(
                    ChallengeReferenceEntity,
                    [referenceData as DeepPartial<ChallengeReferenceEntity>],
                )
                if (referenceTranslations?.length) {
                    await this.upsertService.upsertTranslation(
                        ChallengeReferenceTranslationEntity,
                        referenceTranslations,
                        {
                            challengeReferenceId: reference.id,
                        } as FindOptionsWhere<ChallengeReferenceTranslationEntity>,
                    )
                }
            }
            // drop references removed from source
            await this.upsertService.deleteStaleUuid<ChallengeReferenceEntity>(
                ChallengeReferenceEntity,
                references.map((reference: DeepPartial<ChallengeReferenceEntity>) => reference.id as string),
                {
                    challenge: {
                        id: challengeId,
                    },
                },
            )
        }

        // 5. upsert submissions + nested prompts (mirrors legacy submission handling)
        if (submissions?.length) {
            for (const submission of submissions) {
                const {
                    translations: submissionTranslations,
                    prompts,
                    ...submissionData
                } = submission as DeepPartial<ChallengeSubmissionEntity> & {
                    prompts?: Array<DeepPartial<ChallengeSubmissionPromptEntity>>
                }

                await this.upsertService.upsertUuid(
                    ChallengeSubmissionEntity,
                    [submissionData],
                )

                if (submissionTranslations?.length) {
                    await this.upsertService.upsertTranslation<ChallengeSubmissionTranslationEntity>(
                        ChallengeSubmissionTranslationEntity,
                        submissionTranslations,
                        {
                            challengeSubmissionId: submission.id,
                        },
                    )
                }

                // 5a. upsert this submission's prompts + their translations
                if (prompts?.length) {
                    for (const prompt of prompts) {
                        const {
                            translations: promptTranslations,
                            ...promptData
                        } = prompt
                        await this.upsertService.upsertUuid(
                            ChallengeSubmissionPromptEntity,
                            [promptData],
                        )
                        if (promptTranslations?.length) {
                            await this.upsertService.upsertTranslation<ChallengeSubmissionPromptTranslationEntity>(
                                ChallengeSubmissionPromptTranslationEntity,
                                promptTranslations,
                                {
                                    challengeSubmissionPromptId: prompt.id,
                                },
                            )
                        }
                    }
                    // drop prompts removed from source
                    await this.upsertService.deleteStaleUuid<ChallengeSubmissionPromptEntity>(
                        ChallengeSubmissionPromptEntity,
                        prompts.map((prompt) => prompt.id as string),
                        {
                            challengeSubmission: {
                                id: submission.id,
                            },
                        },
                    )
                }
            }
            // drop submissions removed from source
            await this.upsertService.deleteStaleUuid<ChallengeSubmissionEntity>(
                ChallengeSubmissionEntity,
                (submissions as Array<DeepPartial<ChallengeSubmissionEntity>>).map((submission) => submission.id as string),
                {
                    challenge: {
                        id: challengeId,
                    },
                },
            )
        }
    }
}
