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
    GenerateInterviewQuestionGivenCodeIdParams,
} from "./types"

/**
 * Interview-question given-code UUIDs nest under the owning
 * {@link InterviewQuestionIdFactoryService} id, keyed by language instead of an
 * ordinal (given-code rows are authored one-per-language, not an ordered list).
 */
@Injectable()
export class InterviewQuestionGivenCodeIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
    ) { }

    /**
     * @param params - The parent question id plus the given-code's language.
     * @returns UUID v5 string.
     */
    generate(
        {
            interviewQuestionId,
            lang,
        }: GenerateInterviewQuestionGivenCodeIdParams,
    ): string {
        // anchor the given-code id on its parent question id so reordering
        // questions never collides given-code ids across questions
        return uuidv5(
            this.sha256Service.hash(
                "interview-question-given-code",
                interviewQuestionId,
                lang,
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
