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
    CourseIdFactoryService,
} from "./course.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateFlashcardDeckIdParams,
} from "./types"

/**
 * Flashcard deck root entity; parent id is {@link CourseIdFactoryService}.
 */
@Injectable()
export class FlashcardDeckIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) { }

    /**
     * @param params - Course ordinal and deck index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            flashcardDeckIndex,
        }: GenerateFlashcardDeckIdParams,
    ): string {
        // hash a typed preimage anchored on the owning course id so deck ids
        // stay stable across seeds as long as folder ordering is unchanged
        return uuidv5(
            this.sha256Service.hash(
                "flashcard-deck",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                flashcardDeckIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
