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
    ContentIdFactoryService,
} from "./content.service"
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
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based video in the content’s `lesson-videos` list. */
    lessonVideoIndex: number
}

/**
 * Lesson video entities under a module; parent id is {@link ModuleIdFactoryService}.
 */
@Injectable()
export class LessonVideoIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) {}

    /**
     * @param params - Course / module / content ordinals and video index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            lessonVideoIndex,
        }: GenerateLessonVideoIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "lesson-video",
                this.contentIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                    },
                ),
                lessonVideoIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
