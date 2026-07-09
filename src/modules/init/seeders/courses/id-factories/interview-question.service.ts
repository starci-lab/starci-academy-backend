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
    GenerateInterviewQuestionIdParams,
} from "./types"

/**
 * Mock-interview question root entity; parent id is {@link CourseIdFactoryService}.
 * There is no bank entity to anchor on (banks aren't persisted rows), so the
 * question id hashes the course id directly with its own bank/question ordinals.
 */
@Injectable()
export class InterviewQuestionIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) { }

    /**
     * @param params - Course ordinal, bank folder ordinal, and question folder ordinal.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            bankIndex,
            questionIndex,
        }: GenerateInterviewQuestionIdParams,
    ): string {
        // hash a typed preimage anchored on the owning course id so question ids
        // stay stable across seeds as long as folder ordering is unchanged
        return uuidv5(
            this.sha256Service.hash(
                "interview-question",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                bankIndex.toString(),
                questionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
