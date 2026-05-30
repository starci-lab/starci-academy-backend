import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
    EntityTarget,
    FindOptionsWhere,
} from "typeorm"
import {
    AbstractEntity,
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
    ChallengeSubmissionApproachCriteriaEntity,
    ChallengeSubmissionOutcomeCriteriaEntity,
    UuidAbstractEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"
import {
    purgeLegacyChallengeChildren,
} from "./challenge-insert.service"

/**
 * SCHEMA V2 challenge insert service. ADDITIVE counterpart to {@link ChallengeInsertService}:
 * it persists the same challenge / translations / references / submissions tables BUT routes the
 * requirement/step/output/prerequisite data into the V2 per-language jsonb bucket tables and sets
 * the `outcomeCriteria` / `approachCriteria` jsonb columns. Legacy V1 child rows are purged after
 * each upsert so they do not linger when a challenge migrates to SCHEMA V2.
 */
@Injectable()
export class ChallengeV2InsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upserts normalized V2 bucket items (requirements/steps/outputs/prerequisites). Item-level title
     * translations are written via delete-all + re-insert so legacy jsonb-era rows cannot trip TypeORM
     * cascade orphan handling; the item row itself cascade-saves language rows + body translations.
     */
    private async upsertNormalizedV2Items<
        TItem extends UuidAbstractEntity & {
            translations?: Array<DeepPartial<TTranslation>>
        },
        TTranslation extends AbstractEntity,
    >(
        itemEntityClass: EntityTarget<TItem>,
        titleTranslationEntityClass: EntityTarget<TTranslation>,
        titleTranslationParentIdKey: keyof TTranslation & string,
        items: Array<DeepPartial<TItem>> | undefined,
        parentFilter: FindOptionsWhere<TItem>,
    ): Promise<void> {
        const itemList = items ?? []
        for (const item of itemList) {
            const {
                translations: titleTranslations,
                ...itemWithoutTitleTranslations
            } = item as DeepPartial<TItem> & {
                translations?: Array<DeepPartial<TTranslation>>
            }
            await this.upsertService.upsertTranslation(
                titleTranslationEntityClass,
                titleTranslations ?? [],
                {
                    [titleTranslationParentIdKey]: item.id,
                } as FindOptionsWhere<TTranslation>,
            )
            await this.upsertService.upsertUuid(
                itemEntityClass,
                [itemWithoutTitleTranslations as DeepPartial<TItem>],
            )
        }
        await this.upsertService.deleteStaleUuid(
            itemEntityClass,
            itemList.map((item) => item.id as string),
            parentFilter,
        )
    }

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

        // 3. upsert the four V2 normalized bucket tables (item → title translations + lang rows)
        const v2ParentFilter = {
            challenge: {
                id: challengeId,
            },
        }
        await this.upsertNormalizedV2Items(
            ChallengeRequirementV2Entity,
            ChallengeRequirementV2TranslationEntity,
            "challengeRequirementV2Id",
            requirementsV2 as Array<DeepPartial<ChallengeRequirementV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengeRequirementV2Entity>,
        )
        await this.upsertNormalizedV2Items(
            ChallengeStepV2Entity,
            ChallengeStepV2TranslationEntity,
            "challengeStepV2Id",
            stepsV2 as Array<DeepPartial<ChallengeStepV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengeStepV2Entity>,
        )
        await this.upsertNormalizedV2Items(
            ChallengeOutputV2Entity,
            ChallengeOutputV2TranslationEntity,
            "challengeOutputV2Id",
            outputsV2 as Array<DeepPartial<ChallengeOutputV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengeOutputV2Entity>,
        )
        await this.upsertNormalizedV2Items(
            ChallengePrerequisiteV2Entity,
            ChallengePrerequisiteV2TranslationEntity,
            "challengePrerequisiteV2Id",
            prerequisitesV2 as Array<DeepPartial<ChallengePrerequisiteV2Entity>> | undefined,
            v2ParentFilter as FindOptionsWhere<ChallengePrerequisiteV2Entity>,
        )

        // 4. upsert references + their alias translations (mirrors legacy reference handling)
        const referenceList = references ?? []
        for (const reference of referenceList) {
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
            referenceList.map((reference: DeepPartial<ChallengeReferenceEntity>) => reference.id as string),
            {
                challenge: {
                    id: challengeId,
                },
            },
        )

        // 5. upsert submissions + nested prompts (mirrors legacy submission handling)
        const submissionList = submissions ?? []
        for (const submission of submissionList) {
            const {
                translations: submissionTranslations,
                prompts,
                approachCriteria,
                outcomeCriteria,
                ...submissionData
            } = submission as DeepPartial<ChallengeSubmissionEntity> & {
                prompts?: Array<DeepPartial<ChallengeSubmissionPromptEntity>>
                approachCriteria?: Array<DeepPartial<ChallengeSubmissionApproachCriteriaEntity>>
                outcomeCriteria?: Array<DeepPartial<ChallengeSubmissionOutcomeCriteriaEntity>>
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
            const promptList = prompts ?? []
            for (const prompt of promptList) {
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
                promptList.map((prompt) => prompt.id as string),
                {
                    challengeSubmission: {
                        id: submission.id,
                    },
                },
            )

            // 5b. upsert this submission's V2 grading rubric — approach + outcome criteria.
            // English-only, NO translations and NO per-item score (the 70/30 weight lives on the
            // challenge), so a plain uuid upsert + stale-prune per submission is enough.
            const approachCriteriaList = approachCriteria ?? []
            if (approachCriteriaList.length) {
                await this.upsertService.upsertUuid(
                    ChallengeSubmissionApproachCriteriaEntity,
                    approachCriteriaList,
                )
            }
            await this.upsertService.deleteStaleUuid<ChallengeSubmissionApproachCriteriaEntity>(
                ChallengeSubmissionApproachCriteriaEntity,
                approachCriteriaList.map((criteria) => criteria.id as string),
                {
                    challengeSubmission: {
                        id: submission.id,
                    },
                },
            )

            const outcomeCriteriaList = outcomeCriteria ?? []
            if (outcomeCriteriaList.length) {
                await this.upsertService.upsertUuid(
                    ChallengeSubmissionOutcomeCriteriaEntity,
                    outcomeCriteriaList,
                )
            }
            await this.upsertService.deleteStaleUuid<ChallengeSubmissionOutcomeCriteriaEntity>(
                ChallengeSubmissionOutcomeCriteriaEntity,
                outcomeCriteriaList.map((criteria) => criteria.id as string),
                {
                    challengeSubmission: {
                        id: submission.id,
                    },
                },
            )
        }
        // drop submissions removed from source
        await this.upsertService.deleteStaleUuid<ChallengeSubmissionEntity>(
            ChallengeSubmissionEntity,
            submissionList.map((submission) => submission.id as string),
            {
                challenge: {
                    id: challengeId,
                },
            },
        )

        await purgeLegacyChallengeChildren(
            this.upsertService,
            challengeId,
        )
    }
}
