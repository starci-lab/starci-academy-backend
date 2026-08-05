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
    GenerateLivestreamSessionIdParams,
} from "./types"

@Injectable()
/**
 * Deterministic UUID for a course livestream session row.
 */
export class LivestreamSessionIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * @param params - Course ordinal and session order index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            sessionIndex,
        }: GenerateLivestreamSessionIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "livestream-session",
                this.courseIdFactoryService.generate(
                    {
                        courseIndex,
                    },
                ),
                sessionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
