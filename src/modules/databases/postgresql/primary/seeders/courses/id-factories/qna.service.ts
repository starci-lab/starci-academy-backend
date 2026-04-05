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

/**
 * Input for {@link QnaIdFactoryService.generate}.
 */
export interface GenerateQnaIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based FAQ entry (`## 1.` → index 0 if ordered contiguously). */
    qnaIndex: number
}

/**
 * Course FAQ rows; parent id is {@link CourseIdFactoryService}.
 */
@Injectable()
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
