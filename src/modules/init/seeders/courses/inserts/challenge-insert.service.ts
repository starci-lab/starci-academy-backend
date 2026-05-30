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
    ChallengeRequirementEntity,
    ChallengeRequirementTranslationEntity,
    ChallengeOutputEntity,
    ChallengeOutputTranslationEntity,
    ChallengePrerequisiteEntity,
    ChallengePrerequisiteTranslationEntity,
    ChallengeStepEntity,
    ChallengeStepTranslationEntity,
    ChallengeStepCodeImplementationEntity,
    ChallengeStepCodeImplementationTranslationEntity,
    ChallengeReferenceEntity,
    ChallengeReferenceTranslationEntity,
    ChallengeSubmissionEntity,
    ChallengeSubmissionTranslationEntity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionPromptTranslationEntity,
    ChallengeRequirementV2Entity,
    ChallengeStepV2Entity,
    ChallengeOutputV2Entity,
    ChallengePrerequisiteV2Entity,
    UuidAbstractEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"
import {
    deleteFields,
} from "../utils"

/**
 * Helper to upsert an array of UUID-keyed child entities that have
 * composite-key translations. Each child row is upserted, its translations
 * are replaced, and stale children are deleted.
 */
export async function upsertChildrenWithTranslations
    <
        TChild extends UuidAbstractEntity,
        TTranslation extends AbstractEntity,
    >
(
    upsertService: UpsertService,
    childEntityClass: EntityTarget<TChild>,
    translationEntityClass: EntityTarget<TTranslation>,
    children: Array<DeepPartial<TChild>> | undefined,
    parentFilter: FindOptionsWhere<TChild>,
    translationParentIdKey: keyof TTranslation & string,
): Promise<void> {
    const childList = children ?? []
    if (!childList.length) {
        await upsertService.deleteStaleUuid<TChild>(
            childEntityClass,
            [],
            parentFilter,
        )
        return
    }

    for (const child of childList) {
        const {
            translations,
            ...rest
        } = child as DeepPartial<TChild> & {
            translations?: Array<DeepPartial<TTranslation>>
        }
        await upsertService.upsertUuid<TChild>(
            childEntityClass,
            [rest as DeepPartial<TChild>],
        )
        if (translations?.length) {
            await upsertService.upsertTranslation(
                translationEntityClass,
                translations,
                {
                    [translationParentIdKey]: child.id 
                } as FindOptionsWhere<TTranslation>,
            )
        }
    }

    /** Delete stale children for this parent (scoped to the parent filter). */
    await upsertService.deleteStaleUuid<TChild>(
        childEntityClass,
        childList.map((child) => child.id as string),
        parentFilter,
    )
}

/** Parent filter scoped to one challenge row. */
const challengeParentFilter = (
    challengeId: string,
): {
    challenge: {
        id: string
    }
} => ({
    challenge: {
        id: challengeId,
    },
})

/**
 * Drops every legacy (V1) child row for a challenge. Used after a SCHEMA V2 upsert so orphaned
 * requirement/step/output/prerequisite rows from an earlier V1 seed do not linger.
 *
 * Submissions and references are intentionally excluded — both SCHEMA V1 and V2 persist them in
 * the same tables and the V2 insert pass upserts them just above this purge.
 */
export async function purgeLegacyChallengeChildren(
    upsertService: UpsertService,
    challengeId: string,
): Promise<void> {
    const parentFilter = challengeParentFilter(challengeId)
    const emptyIds: Array<string> = []
    await upsertService.deleteStaleUuid<ChallengeStepEntity>(
        ChallengeStepEntity,
        emptyIds,
        parentFilter,
    )
    await upsertService.deleteStaleUuid<ChallengeRequirementEntity>(
        ChallengeRequirementEntity,
        emptyIds,
        parentFilter,
    )
    await upsertService.deleteStaleUuid<ChallengeOutputEntity>(
        ChallengeOutputEntity,
        emptyIds,
        parentFilter,
    )
    await upsertService.deleteStaleUuid<ChallengePrerequisiteEntity>(
        ChallengePrerequisiteEntity,
        emptyIds,
        parentFilter,
    )
}

/**
 * Drops every SCHEMA V2 bucket child row for a challenge. Used after a legacy upsert so V2 jsonb
 * buckets from an earlier V2 seed do not linger.
 */
export async function purgeV2ChallengeChildren(
    upsertService: UpsertService,
    challengeId: string,
): Promise<void> {
    const parentFilter = challengeParentFilter(challengeId)
    const emptyIds: Array<string> = []
    await upsertService.deleteStaleUuid<ChallengeRequirementV2Entity>(
        ChallengeRequirementV2Entity,
        emptyIds,
        parentFilter,
    )
    await upsertService.deleteStaleUuid<ChallengeStepV2Entity>(
        ChallengeStepV2Entity,
        emptyIds,
        parentFilter,
    )
    await upsertService.deleteStaleUuid<ChallengeOutputV2Entity>(
        ChallengeOutputV2Entity,
        emptyIds,
        parentFilter,
    )
    await upsertService.deleteStaleUuid<ChallengePrerequisiteV2Entity>(
        ChallengePrerequisiteV2Entity,
        emptyIds,
        parentFilter,
    )
}

/**
 * Inserts/updates/deletes challenge-level tables:
 * challenges + translations, requirements, outputs, prerequisites,
 * steps, references, submissions, submission_prompts, and all translations.
 */
@Injectable()
export class ChallengeInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single challenge and ALL its child/grandchild tables.
     */
    async insert(
        challenge: DeepPartial<ChallengeEntity>,
    ): Promise<void> {
        const challengeId = challenge.id as string

        /** 1. Upsert the challenge row itself (strip all nested relations) */
        const {
            translations,
            requirements,
            outputs,
            prerequisites,
            steps,
            references,
            submissions,
            content,
            contentId,
            ...rest
        } = challenge as DeepPartial<ChallengeEntity> & { contentId?: string }

        /** Re-attach FK as relation object for TypeORM */
        const contentRef = content ?? (contentId ? {
            id: contentId 
        } : undefined)
        await this.upsertService.upsertUuid(
            ChallengeEntity,
            [{
                ...rest,
                ...(contentRef ? {
                    content: contentRef 
                } : {
                }),
            }],
        )

        /** 2. Upsert challenge translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                ChallengeTranslationEntity,
                translations,
                {
                    challenge: {
                        id: challengeId
                    }
                },
            )
        }

        /** 3. Upsert requirements + translations */
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengeRequirementEntity,
            ChallengeRequirementTranslationEntity,
            requirements,
            {
                challenge: {
                    id: challengeId 
                } 
            },
            "challengeRequirementId",
        )

        /** 4. Upsert outputs + translations */
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengeOutputEntity,
            ChallengeOutputTranslationEntity,
            outputs,
            {
                challenge: {
                    id: challengeId 
                } 
            },
            "challengeOutputId",
        )

        /** 5. Upsert prerequisites + translations */
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengePrerequisiteEntity,
            ChallengePrerequisiteTranslationEntity,
            prerequisites,
            {
                challenge: {
                    id: challengeId 
                } 
            },
            "challengePrerequisiteId",
        )

        /** 6. Upsert steps, translations, and nested code implementations */
        const stepList = steps ?? []
        for (const step of stepList) {
            const stepTranslations = step.translations
            const codeImplementations = step.codeImplementations
            const stepData = deleteFields(
                    step as DeepPartial<ChallengeStepEntity>,
                    [
                        "translations",
                        "codeImplementations",
                        // KEEP "challenge" — needed để upsert set FK challenge_id; xóa nó → step.challenge_id = NULL.
                    ],
            )
            await this.upsertService.upsertUuid(
                ChallengeStepEntity,
                [stepData],
            )
            if (stepTranslations?.length) {
                await this.upsertService.upsertTranslation(
                    ChallengeStepTranslationEntity,
                    stepTranslations,
                    {
                        challengeStepId: step.id as string,
                    },
                )
            }
            const stepId = step.id as string
            const implList = codeImplementations ?? []
            for (const implementation of implList) {
                const implTranslations = implementation.translations
                const implData = deleteFields(
                        implementation as DeepPartial<ChallengeStepCodeImplementationEntity>,
                        [
                            "translations",
                            // KEEP "challengeStep" — needed để upsert set FK challenge_step_id.
                        ],
                )
                await this.upsertService.upsertUuid(
                    ChallengeStepCodeImplementationEntity,
                    [implData],
                )
                if (implTranslations?.length) {
                    await this.upsertService.upsertTranslation(
                        ChallengeStepCodeImplementationTranslationEntity,
                        implTranslations,
                        {
                            challengeStepCodeImplementationId: implementation.id as string,
                        },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<ChallengeStepCodeImplementationEntity>(
                ChallengeStepCodeImplementationEntity,
                implList.map((row) => row.id ?? ""),
                {
                    challengeStep: {
                        id: stepId,
                    },
                },
            )
        }
        await this.upsertService.deleteStaleUuid<ChallengeStepEntity>(
            ChallengeStepEntity,
            stepList.map((row) => row.id ?? ""),
            {
                challenge: {
                    id: challengeId 
                } 
            },
        )

        /** 7. Upsert references + translations */
        await upsertChildrenWithTranslations(
            this.upsertService,
            ChallengeReferenceEntity,
            ChallengeReferenceTranslationEntity,
            references,
            {
                challenge: {
                    id: challengeId 
                } 
            },
            "challengeReferenceId",
        )

        /** 8. Upsert submissions (with nested prompts) */
        const submissionList = submissions ?? []
        for (const submission of submissionList) {
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
                        challengeSubmissionId: submission.id
                    },
                )
            }

            /** 8a. Upsert submission prompts + translations */
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
                            challengeSubmissionPromptId: prompt.id 
                        },
                    )
                }
            }
            /** Delete stale prompts for this submission */
            await this.upsertService.deleteStaleUuid<ChallengeSubmissionPromptEntity>(
                ChallengeSubmissionPromptEntity,
                promptList.map((prompt) => prompt.id as string),
                {
                    challengeSubmission:
                    {
                        id: submission.id
                    }
                },
            )
        }
        /** Delete stale submissions */
        await this.upsertService.deleteStaleUuid<ChallengeSubmissionEntity>(
            ChallengeSubmissionEntity,
            submissionList.map((submission) => submission.id as string),
            {
                challenge:
                {
                    id: challengeId
                }
            },
        )

        await purgeV2ChallengeChildren(
            this.upsertService,
            challengeId,
        )
    }

    /**
     * Delete stale challenges for a content.
     */
    async deleteStale(
        ids: Array<string>,
        contentId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<ChallengeEntity>(
            ChallengeEntity,
            ids,
            {
                content:
                {
                    id: contentId
                }
            },
        )
    }
}
