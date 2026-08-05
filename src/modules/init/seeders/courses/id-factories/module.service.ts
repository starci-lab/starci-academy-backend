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
    GenerateModuleIdParams,
} from "./types"

@Injectable()
/**
 * Module UUIDs chain from the parent course id string produced by {@link CourseIdFactoryService}.
 */
export class ModuleIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params.courseIndex - Parent course ordinal.
     * @param params.moduleIndex - Module ordinal under that course.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
        }: GenerateModuleIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "module",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                moduleIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
