import {
    InjectPrimaryPostgreSQLEntityManager,
    LessonVideoEntity,
    Locale,
} from "@modules/databases"
import {
    LessonVideoNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    LessonVideoTransformerService,
} from "../../../utils"
import type {
    EntityManager,
} from "typeorm"
import type {
    LessonVideoRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"

/**
 * Loads lesson video shell data (no translations — fetch those by id).
 */
@Injectable()
export class LessonVideoQueryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly lessonVideoTransformer: LessonVideoTransformerService,
    ) {}

    /**
     * Entry: returns one lesson video by primary id.
     *
     * @param request - Wrapper with lesson video id
     * @param request.id - Lesson video id
     * @throws {LessonVideoNotFoundException} When no lesson video exists for `id`.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<LessonVideoRequest>,
    ): Promise<LessonVideoEntity> {
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id: request.id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException(
                {
                    id: request.id,
                },
            )
        }
        this.lessonVideoTransformer.transform(
            lessonVideo,
            locale,
            lessonVideo.defaultLocale ?? Locale.En,
        )
        return lessonVideo
    }
}
