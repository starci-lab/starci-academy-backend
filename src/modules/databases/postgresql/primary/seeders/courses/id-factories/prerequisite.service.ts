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
 * Input for {@link PrerequisiteIdFactoryService.generate}.
 */
export interface GeneratePrerequisiteIdParams {
    /** Owning course ordinal. */
    courseIndex: number
    /** Zero-based line in the course “Prerequisites” list. */
    prerequisiteIndex: number
}

/**
 * Prerequisite bullets on a course; parent id is {@link CourseIdFactoryService}.
 */
@Injectable()
export class PrerequisiteIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params - Course ordinal and prerequisite index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            prerequisiteIndex,
        }: GeneratePrerequisiteIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "prerequisite",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                prerequisiteIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
