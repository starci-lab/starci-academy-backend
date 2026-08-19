import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    MoreThan,
    type EntityManager,
} from "typeorm"

/**
 * Cursor-fetch helpers shared by every init synchronizer (Elasticsearch, Indexer,
 * CDN). Each returns a `fetchNext` closure for {@link runPaginatedEntitySync}:
 * given the previously seen id (or `null` on the first page), it loads the next
 * row of that entity kind in `id ASC` order with the relations that entity kind's
 * sync (and scope filter) rely on. This is the exact query shape every
 * synchronizer used to redeclare per entity kind.
 */

/** Next `CourseEntity` row after `resumeEntityId`, no relations needed. */
export const fetchNextCourse = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<CourseEntity | null> =>
    entityManager.findOne(
        CourseEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `ChallengeEntity` row after `resumeEntityId`, hydrated up to its course. */
export const fetchNextChallenge = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<ChallengeEntity | null> =>
    entityManager.findOne(
        ChallengeEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            relations: {
                content: {
                    module: {
                        course: true,
                    },
                },
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `ContentEntity` row after `resumeEntityId`, hydrated up to its course. */
export const fetchNextContent = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<ContentEntity | null> =>
    entityManager.findOne(
        ContentEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            relations: {
                module: {
                    course: true,
                },
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `ModuleEntity` row after `resumeEntityId`, hydrated with its course. */
export const fetchNextModule = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<ModuleEntity | null> =>
    entityManager.findOne(
        ModuleEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            relations: {
                course: true,
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `MilestoneEntity` row after `resumeEntityId`, hydrated with its course. */
export const fetchNextMilestone = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<MilestoneEntity | null> =>
    entityManager.findOne(
        MilestoneEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            relations: {
                course: true,
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `MilestoneTaskEntity` row after `resumeEntityId`, hydrated up to its course. */
export const fetchNextMilestoneTask = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<MilestoneTaskEntity | null> =>
    entityManager.findOne(
        MilestoneTaskEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            relations: {
                milestone: {
                    course: true,
                },
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `FoundationCategoryEntity` row after `resumeEntityId`, no relations needed. */
export const fetchNextFoundationCategory = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<FoundationCategoryEntity | null> =>
    entityManager.findOne(
        FoundationCategoryEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `FoundationEntity` row after `resumeEntityId`, no relations needed. */
export const fetchNextFoundation = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<FoundationEntity | null> =>
    entityManager.findOne(
        FoundationEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId)
                    } : {
                    }
                ),
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `HeadhuntingCompanyEntity` row after `resumeEntityId`, no relations needed. */
export const fetchNextHeadhuntingCompany = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<HeadhuntingCompanyEntity | null> =>
    entityManager.findOne(
        HeadhuntingCompanyEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId),
                    } : {
                    }
                ),
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `ConsultantEntity` row after `resumeEntityId`, no relations needed. */
export const fetchNextConsultant = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<ConsultantEntity | null> =>
    entityManager.findOne(
        ConsultantEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId),
                    } : {
                    }
                ),
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `FlashcardDeckEntity` row after `resumeEntityId`, no relations needed. */
export const fetchNextFlashcardDeck = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<FlashcardDeckEntity | null> =>
    entityManager.findOne(
        FlashcardDeckEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId),
                    } : {
                    }
                ),
            },
            order: {
                id: "ASC",
            },
        },
    )

/** Next `CodingProblemEntity` row after `resumeEntityId`, no relations needed. */
export const fetchNextCodingProblem = (
    entityManager: EntityManager,
) => (
    resumeEntityId: string | null,
): Promise<CodingProblemEntity | null> =>
    entityManager.findOne(
        CodingProblemEntity,
        {
            where: {
                ...(
                    resumeEntityId ? {
                        id: MoreThan(resumeEntityId),
                    } : {
                    }
                ),
            },
            order: {
                id: "ASC",
            },
        },
    )
