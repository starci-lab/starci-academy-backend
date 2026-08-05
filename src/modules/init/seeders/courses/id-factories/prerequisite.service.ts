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
    GeneratePrerequisiteIdParams,
} from "./types"

@Injectable()
/**
 * Prerequisite bullets on a course; parent id is {@link CourseIdFactoryService}.
 */
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
