import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    QuizCardEntity,
    QuizCardOptionEntity,
    QuizCardOptionTranslationEntity,
    QuizCardTranslationEntity,
    QuizDeckEntity,
    QuizDeckTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"
import {
    deleteFields,
} from "../utils"
import {
    isCoursesQuizLinkContentsEnabled,
} from "../../shared/scope"

/**
 * Inserts/updates quiz-deck-level tables:
 * quiz_decks + translations, quiz_cards + translations,
 * quiz_card_options + translations, plus the quiz_deck_contents N:N junction.
 */
@Injectable()
export class QuizDeckInsertService {
    constructor(
        private readonly upsertService: UpsertService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Upsert a single quiz deck and ALL its child/grandchild tables.
     *
     * @param deck - Parsed deck graph (deck → cards → options + translations).
     */
    async insert(
        deck: DeepPartial<QuizDeckEntity>,
    ): Promise<void> {
        const quizDeckId = deck.id as string

        // 1. Upsert the deck row itself, stripping nested relations first
        const {
            translations,
            cards,
            course,
            courseId,
            contents,
            ...rest
        } = deck as DeepPartial<QuizDeckEntity> & { courseId?: string }

        // re-attach the owning course as a relation object so TypeORM writes course_id
        const courseRef = course ?? (courseId ? {
            id: courseId,
        } : undefined)
        await this.upsertService.upsertUuid(
            QuizDeckEntity,
            [{
                ...rest,
                ...(courseRef ? {
                    course: courseRef,
                } : {
                }),
            }],
        )

        // 1b. Reconcile N:N content links only when enabled (skip junction otherwise)
        if (isCoursesQuizLinkContentsEnabled()) {
            const linkedContentIds = Array.from(
                new Set(
                    (contents ?? [])
                        .map((content) => (content as DeepPartial<ContentEntity>)?.id)
                        .filter((id): id is string => Boolean(id)),
                ),
            )
            const existingContents = await this.entityManager
                .createQueryBuilder()
                .relation(QuizDeckEntity,
                    "contents")
                .of(quizDeckId)
                .loadMany<ContentEntity>()
            const existingContentIds = existingContents.map((content) => content.id)
            const toAdd = linkedContentIds.filter(
                (id) => !existingContentIds.includes(id),
            )
            const toRemove = existingContentIds.filter(
                (id) => !linkedContentIds.includes(id),
            )
            if (toAdd.length > 0 || toRemove.length > 0) {
                await this.entityManager
                    .createQueryBuilder()
                    .relation(QuizDeckEntity,
                        "contents")
                    .of(quizDeckId)
                    .addAndRemove(toAdd,
                        toRemove)
            }
        }

        // 2. Upsert deck translations (composite-key: delete-all + re-insert)
        if (translations) {
            await this.upsertService.upsertTranslation(
                QuizDeckTranslationEntity,
                translations,
                {
                    deck: {
                        id: quizDeckId,
                    },
                },
            )
        }

        // 3. Upsert cards, their translations, and nested options
        if (cards !== undefined) {
            for (const card of cards) {
                const cardTranslations = card.translations
                const options = card.options
                // strip nested arrays but KEEP `deck` so the FK quiz_deck_id is set
                const cardData = deleteFields(
                    card as DeepPartial<QuizCardEntity>,
                    [
                        "translations",
                        "options",
                    ],
                )
                await this.upsertService.upsertUuid(
                    QuizCardEntity,
                    [cardData],
                )
                // card translations replace the prior set for this card
                if (cardTranslations?.length) {
                    await this.upsertService.upsertTranslation(
                        QuizCardTranslationEntity,
                        cardTranslations,
                        {
                            quizCardId: card.id as string,
                        },
                    )
                }
                const quizCardId = card.id as string
                const optionList = options ?? []
                for (const option of optionList) {
                    const optionTranslations = option.translations
                    // strip translations but KEEP `card` so the FK quiz_card_id is set
                    const optionData = deleteFields(
                        option as DeepPartial<QuizCardOptionEntity>,
                        [
                            "translations",
                        ],
                    )
                    await this.upsertService.upsertUuid(
                        QuizCardOptionEntity,
                        [optionData],
                    )
                    if (optionTranslations?.length) {
                        await this.upsertService.upsertTranslation(
                            QuizCardOptionTranslationEntity,
                            optionTranslations,
                            {
                                quizCardOptionId: option.id as string,
                            },
                        )
                    }
                }
                // drop options removed from the deck markdown since the last seed
                await this.upsertService.deleteStaleUuid<QuizCardOptionEntity>(
                    QuizCardOptionEntity,
                    optionList.map((option) => option.id ?? ""),
                    {
                        card: {
                            id: quizCardId,
                        },
                    },
                )
            }
            // drop cards removed from the deck markdown since the last seed
            await this.upsertService.deleteStaleUuid<QuizCardEntity>(
                QuizCardEntity,
                cards.map((card) => card.id ?? ""),
                {
                    deck: {
                        id: quizDeckId,
                    },
                },
            )
        }
    }

    /**
     * Delete stale decks for a course.
     *
     * @param ids - Deck ids to keep.
     * @param courseId - Owning course id.
     */
    async deleteStale(
        ids: Array<string>,
        courseId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<QuizDeckEntity>(
            QuizDeckEntity,
            ids,
            {
                course: {
                    id: courseId,
                },
            },
        )
    }
}
