import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    QuizCardEntity,
} from "@modules/databases"
import {
    QuizDeckNotFoundException,
} from "@modules/exceptions"
import type {
    GradeQuizTestParams,
    GradeQuizTestResult,
    QuizTestCardResult,
} from "./types"

/**
 * Grades Test-mode submissions. Each card carries multiple-choice options with
 * exactly one `isCorrect` flag, so grading is deterministic: the selected
 * option is matched against the correct one.
 */
@Injectable()
export class QuizTestGradingService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Grades a whole Test submission.
     *
     * @param params - Deck id and the submitted answers.
     * @returns Per-card results plus the aggregate score.
     */
    async gradeTest(
        {
            quizDeckId,
            answers,
        }: GradeQuizTestParams,
    ): Promise<GradeQuizTestResult> {
        // load the deck's cards together with their options for grading
        const cards = await this.entityManager.find(
            QuizCardEntity,
            {
                where: {
                    deck: {
                        id: quizDeckId,
                    },
                },
                relations: {
                    options: true,
                },
            },
        )
        // an empty result set means the deck id is wrong or the deck has no cards
        if (cards.length === 0) {
            throw new QuizDeckNotFoundException({
                quizDeckId,
            })
        }
        // index cards by id so each answer can be graded in O(1)
        const cardById = new Map(cards.map((card) => [card.id,
            card]))

        const results: Array<QuizTestCardResult> = []
        let correctCount = 0
        for (const answer of answers) {
            const card = cardById.get(answer.quizCardId)
            // ignore answers for cards that are not part of this deck
            if (!card) {
                continue
            }
            // locate the single correct option for this card
            const correctOption = (card.options ?? []).find(
                (option) => option.isCorrect,
            )
            const correctOptionId = correctOption?.id ?? null
            // the answer is correct when the selection matches the correct option
            const correct =
                correctOptionId !== null
                && answer.selectedOptionId === correctOptionId
            if (correct) {
                correctCount += 1
            }
            results.push({
                quizCardId: answer.quizCardId,
                selectedOptionId: answer.selectedOptionId,
                correctOptionId,
                correct,
            })
        }

        // aggregate score over the graded answers, guarding divide-by-zero
        const total = results.length
        const scorePercent = total > 0
            ? Math.round((correctCount / total) * 100)
            : 0

        return {
            quizDeckId,
            total,
            correct: correctCount,
            scorePercent,
            results,
        }
    }
}
