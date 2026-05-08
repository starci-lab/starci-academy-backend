import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    CourseEntity,
    CourseTranslationEntity,
    PricingPhaseEntity,
    PrerequisiteEntity,
    PrerequisiteTranslationEntity,
    ValuePropositionEntity,
    ValuePropositionTranslationEntity,
    QnaEntity,
    QnaTranslationEntity,
    LivestreamSessionEntity,
    LivestreamSessionTranslationEntity,
    CourseMetadataEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"

/**
 * Inserts/updates/deletes course-level tables:
 * courses, course_translations, pricing_phases, prerequisites,
 * value_propositions, qnas, livestream_sessions, course_metadata.
 */
@Injectable()
export class CourseInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single course and all its direct child tables.
     * Relations deeper than course (modules, contents, etc.) are NOT handled here.
     */
    async insert(
        course: DeepPartial<CourseEntity>
    ): Promise<void> {
        const courseId = course.id as string

        /** 1. Upsert the course row itself (strip nested relations) */
        const {
            translations,
            pricingPhases,
            prerequisites,
            valuePropositions,
            qnas,
            livestreamSessions,
            metadata,
            modules: _modules,
            enrollments: _enrollments,
            ...rest
        } = course

        await this.upsertService.upsertUuid(
            CourseEntity,
            [rest],
        )

        /** 2. Upsert course translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                CourseTranslationEntity,
                translations,
                { courseId },
            )
        }

        /** 3. Upsert pricing phases */
        if (pricingPhases) {
            await this.upsertService.upsertUuid(
                PricingPhaseEntity,
                pricingPhases,
                { course: { id: courseId } },
            )
        }

        /** 4. Upsert prerequisites + their translations */
        if (prerequisites) {
            for (const prerequisite of prerequisites) {
                const {
                    translations: prerequisiteTranslations,
                    ...prerequisiteData
                } = prerequisite
                await this.upsertService.upsertUuid(
                    PrerequisiteEntity,
                    [prerequisiteData],
                )
                if (prerequisiteTranslations?.length) {
                    await this.upsertService.upsertTranslation<PrerequisiteTranslationEntity>(
                        PrerequisiteTranslationEntity,
                        prerequisiteTranslations,
                        { prerequisiteId: prerequisite.id },
                    )
                }
            }
            /** Delete stale prerequisites */
            await this.upsertService.deleteStaleUuid<PrerequisiteEntity>(
                PrerequisiteEntity,
                prerequisites.map((prerequisite) => prerequisite.id as string),
                { course: { id: courseId } },
            )
        }

        /** 5. Upsert value propositions + their translations */
        if (valuePropositions) {
            for (const valueProposition of valuePropositions) {
                const {
                    translations: valuePropositionTranslations,
                    ...valuePropositionData
                } = valueProposition
                await this.upsertService.upsertUuid(
                    ValuePropositionEntity,
                    [valuePropositionData],
                )
                if (valuePropositionTranslations?.length) {
                    await this.upsertService.upsertTranslation<ValuePropositionTranslationEntity>(
                        ValuePropositionTranslationEntity,
                        valuePropositionTranslations,
                        {
                            valuePropositionId: valueProposition.id
                        },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<ValuePropositionEntity>(
                ValuePropositionEntity,
                (valuePropositions as Array<DeepPartial<ValuePropositionEntity>>)
                    .map((valueProposition) => valueProposition.id as string),
                {
                    course:
                    {
                        id: courseId
                    }
                },
            )
        }

        /** 6. Upsert QnAs + their translations */
        if (qnas) {
            for (const qna of qnas) {
                const {
                    translations: qnaTranslations,
                    ...qnaData
                } = qna
                await this.upsertService.upsertUuid(
                    QnaEntity,
                    [qnaData],
                )
                if (qnaTranslations?.length) {
                    await this.upsertService.upsertTranslation<QnaTranslationEntity>(
                        QnaTranslationEntity,
                        qnaTranslations,
                        {
                            qnaId: qna.id
                        },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<QnaEntity>(
                QnaEntity,
                (qnas as Array<DeepPartial<QnaEntity>>).map((qna) => qna.id as string),
                {
                    course:
                    {
                        id: courseId
                    }
                },
            )
        }

        /** 7. Upsert livestream sessions + their translations */
        if (livestreamSessions) {
            for (const session of livestreamSessions) {
                const {
                    translations: sessionTranslations,
                    ...sessionData
                } = session
                await this.upsertService.upsertUuid(
                    LivestreamSessionEntity,
                    [sessionData],
                )
                if (sessionTranslations?.length) {
                    await this.upsertService.upsertTranslation<LivestreamSessionTranslationEntity>(
                        LivestreamSessionTranslationEntity,
                        sessionTranslations,
                        { livestreamSessionId: session.id },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<LivestreamSessionEntity>(
                LivestreamSessionEntity,
                (livestreamSessions as Array<DeepPartial<LivestreamSessionEntity>>)
                    .map((session) => session.id as string),
                {
                    course:
                    {
                        id: courseId
                    }
                },
            )
        }

        /** 8. Upsert course metadata */
        if (metadata) {
            await this.upsertService.upsertUuid(
                CourseMetadataEntity,
                [metadata],
            )
        }
    }
}
