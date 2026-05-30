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
    if (!children?.length) return

    for (const child of children) {
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
        children.map((child) => child.id as string),
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
        if (steps !== undefined) {
            for (const step of steps) {
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
                steps.map((row) => row.id ?? ""),
                {
                    challenge: {
                        id: challengeId 
                    } 
                },
            )
        }

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
                            challengeSubmissionId: submission.id
                        },
                    )
                }

                /** 8a. Upsert submission prompts + translations */
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
                                    challengeSubmissionPromptId: prompt.id 
                                },
                            )
                        }
                    }
                    /** Delete stale prompts for this submission */
                    await this.upsertService.deleteStaleUuid<ChallengeSubmissionPromptEntity>(
                        ChallengeSubmissionPromptEntity,
                        prompts.map((prompt) => prompt.id as string),
                        {
                            challengeSubmission:
                            {
                                id: submission.id
                            }
                        },
                    )
                }
            }
            /** Delete stale submissions */
            await this.upsertService.deleteStaleUuid<ChallengeSubmissionEntity>(
                ChallengeSubmissionEntity,
                (submissions as Array<DeepPartial<ChallengeSubmissionEntity>>).map((submission) => submission.id as string),
                {
                    challenge:
                    {
                        id: challengeId
                    }
                },
            )
        }
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
