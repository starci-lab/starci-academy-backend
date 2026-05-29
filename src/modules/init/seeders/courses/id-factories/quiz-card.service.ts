import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto"
import {
    envConfig,
} from "@modules/env"
import {
    QuizDeckIdFactoryService,
} from "./quiz-deck.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateQuizCardIdParams,
} from "./types"

/**
 * Quiz card UUIDs nest under the owning {@link QuizDeckIdFactoryService} id.
 */
@Injectable()
export class QuizCardIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly quizDeckIdFactoryService: QuizDeckIdFactoryService,
    ) { }

    /**
     * @param params - Deck-locating ordinals plus the card index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            quizDeckIndex,
            quizCardIndex,
        }: GenerateQuizCardIdParams,
    ): string {
        // anchor the card id on its parent deck id so reordering decks never
        // collides card ids across decks
        return uuidv5(
            this.sha256Service.hash(
                "quiz-card",
                this.quizDeckIdFactoryService.generate(
                    {
                        courseIndex,
                        quizDeckIndex,
                    },
                ),
                quizCardIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
