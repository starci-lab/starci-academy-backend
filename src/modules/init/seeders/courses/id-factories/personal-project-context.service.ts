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
 * Input for {@link PersonalProjectContextIdFactoryService.generate}.
 */
export interface GeneratePersonalProjectContextIdParams {
    /**
     * Zero-based course index.
     */
    courseIndex: number
}

/**
 * Personal project context UUIDs — one per course.
 */
@Injectable()
export class PersonalProjectContextIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params.courseIndex - Parent course ordinal.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
        }: GeneratePersonalProjectContextIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "personal-project-context",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
