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
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateInterviewQuestionEqIdParams,
} from "../types"

@Injectable()
/**
 * Behavioral (global) mock-interview question id factory. There is no owning
 * course/bank entity to anchor on (the behavioral bank is global, non-course-scoped),
 * so the id hashes the bank + question ordinals directly.
 */
export class InterviewQuestionEqIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
    ) { }

    /**
     * @param params - The behavioral bank folder ordinal and question folder ordinal.
     * @returns UUID v5 string.
     */
    generate(
        {
            bankIndex,
            questionIndex,
        }: GenerateInterviewQuestionEqIdParams,
    ): string {
        // hash a typed preimage distinct from the technical factory's ("interview-question")
        // so a technical and behavioral question can never collide even with matching ordinals
        return uuidv5(
            this.sha256Service.hash(
                "interview-question-eq",
                bankIndex.toString(),
                questionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
