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
    GenerateQuizDeckIdParams,
} from "./types"

/**
 * Quiz deck root entity; parent id is {@link CourseIdFactoryService}.
 */
@Injectable()
export class QuizDeckIdFactoryService {
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
            quizDeckIndex,
        }: GenerateQuizDeckIdParams,
    ): string {
        // hash a typed preimage anchored on the owning course id so deck ids
        // stay stable across seeds as long as folder ordering is unchanged
        return uuidv5(
            this.sha256Service.hash(
                "quiz-deck",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                quizDeckIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
