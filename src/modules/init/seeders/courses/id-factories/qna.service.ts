import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    CourseIdFactoryService,
} from "./course.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateQnaIdParams,
} from "./types"

@Injectable()
/**
 * Course FAQ rows; parent id is {@link CourseIdFactoryService}.
 */
export class QnaIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params - Course ordinal and Q&A slot index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            qnaIndex,
        }: GenerateQnaIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "qna",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                qnaIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
