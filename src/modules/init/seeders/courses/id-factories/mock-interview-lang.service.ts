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
    MockInterviewIdFactoryService,
} from "./mock-interview.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateMockInterviewLangIdParams,
} from "./types"

/**
 * Per-programming-language `givenCode` variant of a mock-interview question;
 * nests under the owning {@link MockInterviewIdFactoryService} id.
 */
@Injectable()
export class MockInterviewLangIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly mockInterviewIdFactoryService: MockInterviewIdFactoryService,
    ) { }

    /**
     * @param params - Question-locating ordinals plus the lang-variant index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            bankIndex,
            questionIndex,
            langIndex,
        }: GenerateMockInterviewLangIdParams,
    ): string {
        // anchor the lang-variant id on its parent question id so reordering
        // questions never collides lang-variant ids across questions
        return uuidv5(
            this.sha256Service.hash(
                "mock-interview-lang",
                this.mockInterviewIdFactoryService.generate(
                    {
                        courseIndex,
                        bankIndex,
                        questionIndex,
                    },
                ),
                langIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
