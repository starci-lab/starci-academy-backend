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
        const fallbackLocale = lessonVideo.defaultLocale ?? Locale.En
        this.lessonVideoTransformer.transform(
            lessonVideo,
            locale,
            fallbackLocale,
        )
        return lessonVideo
    }
}
