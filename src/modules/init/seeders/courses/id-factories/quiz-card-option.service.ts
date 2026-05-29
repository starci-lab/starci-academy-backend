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
    QuizCardIdFactoryService,
} from "./quiz-card.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateQuizCardOptionIdParams,
} from "./types"

/**
 * Quiz card option UUIDs nest under the owning {@link QuizCardIdFactoryService} id.
 */
@Injectable()
export class QuizCardOptionIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly quizCardIdFactoryService: QuizCardIdFactoryService,
    ) { }

    /**
     * @param params - Card-locating ordinals plus the option index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            quizDeckIndex,
            quizCardIndex,
            quizCardOptionIndex,
        }: GenerateQuizCardOptionIdParams,
    ): string {
        // anchor the option id on its parent card id to keep option ids stable
        // and unique across cards
        return uuidv5(
            this.sha256Service.hash(
                "quiz-card-option",
                this.quizCardIdFactoryService.generate(
                    {
                        courseIndex,
                        quizDeckIndex,
                        quizCardIndex,
                    },
                ),
                quizCardOptionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
