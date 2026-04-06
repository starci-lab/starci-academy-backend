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
    v5 as uuidv5,
} from "uuid"

/**
 * Input for {@link CourseIdFactoryService.generate}.
 */
export interface GenerateCourseIdParams {
    /**
     * Zero-based position of the course in the seeded course list.
     */
    courseIndex: number
}

/**
 * Builds deterministic course UUIDs: SHA-256 over typed preimage segments, then UUID v5
 * under {@link envConfig} `uuidNamespace.course`.
 */
@Injectable()
export class CourseIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
    ) {}

    /**
     * Produces a stable course id for the given ordinal course index.
     *
     * @param params - Ordinal indices (not slug names).
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
        }: GenerateCourseIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "course",
                courseIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
