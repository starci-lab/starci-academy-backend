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
import type {
    GenerateLessonVideoIdParams,
} from "./types"

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
