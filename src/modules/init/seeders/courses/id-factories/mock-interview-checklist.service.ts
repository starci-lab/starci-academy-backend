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
    GenerateMockInterviewChecklistIdParams,
} from "./types"

@Injectable()
/**
 * One coverage checkpoint of a mock-interview question; nests under the owning
 * {@link MockInterviewIdFactoryService} id.
 */
export class MockInterviewChecklistIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly mockInterviewIdFactoryService: MockInterviewIdFactoryService,
    ) { }

    /**
     * @param params - Question-locating ordinals plus the checkpoint index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            bankIndex,
            questionIndex,
            checklistIndex,
        }: GenerateMockInterviewChecklistIdParams,
    ): string {
        // anchor the checkpoint id on its parent question id so reordering questions
        // never collides checkpoint ids across questions
        return uuidv5(
            this.sha256Service.hash(
                "mock-interview-checklist",
                this.mockInterviewIdFactoryService.generate(
                    {
                        courseIndex,
                        bankIndex,
                        questionIndex,
                    },
                ),
                checklistIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
