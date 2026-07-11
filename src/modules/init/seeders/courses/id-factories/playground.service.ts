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
    GeneratePlaygroundIdParams,
} from "./types"

/**
 * Playground root entity; parent id is {@link CourseIdFactoryService}.
 */
@Injectable()
export class PlaygroundIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) { }

    /**
     * @param params - Course ordinal and playground index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            playgroundIndex,
        }: GeneratePlaygroundIdParams,
    ): string {
        // hash a typed preimage anchored on the owning course id so playground ids
        // stay stable across seeds as long as folder ordering is unchanged
        return uuidv5(
            this.sha256Service.hash(
                "playground",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                playgroundIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
