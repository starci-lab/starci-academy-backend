import {
    Injectable,
} from "@nestjs/common"
import {
    GraphQLError,
} from "graphql"
import {
    EntityManager
} from "typeorm"
import {
    ClozeParserService
} from "@modules/bussiness/flashcard/cloze/cloze-parser.service"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    FlashcardQuizEligibilityData
} from "./graphql-types/response"

@Injectable()
/** Computes advisory eligible-card coverage for an authorized course/deck scope. */
export class FlashcardQuizEligibilityService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager,
        private readonly parser: ClozeParserService,
    ) {}

    async find(_userId: string, courseId: string, deckIds: Array<string>, requestedCount: number): Promise<FlashcardQuizEligibilityData> {
        const scope = [...new Set(deckIds)]
            .sort((left, right) => left.localeCompare(right))
        if (scope.length) {
            const decks: Array<{ id: string }> = await this.entityManager.query(
                "SELECT id FROM flashcard_decks WHERE course_id = $1 AND id = ANY($2::uuid[])",
                [courseId,
                    scope],
            )
            if (decks.length !== scope.length) throw new GraphQLError("INVALID_DECK_SCOPE",
                {
                    extensions: {
                        code: "INVALID_DECK_SCOPE",
                    },
                })
        }
        const cards: Array<{ answer: string | null }> = await this.entityManager.query(
            `SELECT c.answer FROM flashcard_cards c
              JOIN flashcard_decks d ON d.id = c.flashcard_deck_id
             WHERE d.course_id = $1
               AND ($2::uuid[] IS NULL OR d.id = ANY($2::uuid[]))`,
            [courseId,
                scope.length ? scope : null],
        )
        const eligibleCount = cards.filter(({ answer }) => this.parser.isEligible(answer)).length
        return {
            eligibleCount,
            requestedCount,
            canStart: eligibleCount >= requestedCount,
            reason: eligibleCount >= requestedCount ? null : "INSUFFICIENT_CLOZE_CARDS",
        }
    }
}
