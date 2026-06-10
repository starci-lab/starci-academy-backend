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
    FlashcardDeckIdFactoryService,
} from "./flashcard-deck.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateFlashcardCardIdParams,
} from "./types"

/**
 * Flashcard card UUIDs nest under the owning {@link FlashcardDeckIdFactoryService} id.
 */
@Injectable()
export class FlashcardCardIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly flashcardDeckIdFactoryService: FlashcardDeckIdFactoryService,
    ) { }

    /**
     * @param params - Deck-locating ordinals plus the card index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            flashcardDeckIndex,
            flashcardCardIndex,
        }: GenerateFlashcardCardIdParams,
    ): string {
        // anchor the card id on its parent deck id so reordering decks never
        // collides card ids across decks
        return uuidv5(
            this.sha256Service.hash(
                "flashcard-card",
                this.flashcardDeckIdFactoryService.generate(
                    {
                        courseIndex,
                        flashcardDeckIndex,
                    },
                ),
                flashcardCardIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
