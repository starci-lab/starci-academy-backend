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
    GenerateMockInterviewIdParams,
} from "./types"

/**
 * One authored mock-interview question row; parent id is {@link CourseIdFactoryService}.
 * Banks have no entity of their own, so the bank ordinal is hashed straight into
 * the question preimage instead of going through an intermediate bank factory.
 */
@Injectable()
export class MockInterviewIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) { }

    /**
     * @param params - Course ordinal, bank index, question index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            bankIndex,
            questionIndex,
        }: GenerateMockInterviewIdParams,
    ): string {
        // hash a typed preimage anchored on the owning course id so question ids
        // stay stable across seeds as long as bank/question folder ordering is unchanged
        return uuidv5(
            this.sha256Service.hash(
                "mock-interview",
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
