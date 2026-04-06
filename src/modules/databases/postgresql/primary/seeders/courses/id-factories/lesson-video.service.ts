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
    ModuleIdFactoryService,
} from "./module.service"
import {
    v5 as uuidv5,
} from "uuid"

/**
 * Input for {@link LessonVideoIdFactoryService.generate}.
 */
export interface GenerateLessonVideoIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Zero-based video in the module’s `lessonVideos` list. */
    lessonVideoIndex: number
}

/**
 * Lesson video entities under a module; parent id is {@link ModuleIdFactoryService}.
 */
@Injectable()
export class LessonVideoIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
    ) {}

    /**
     * @param params - Course / module ordinals and video index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            lessonVideoIndex,
        }: GenerateLessonVideoIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "lesson-video",
                this.moduleIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                    },
                ),
                lessonVideoIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
