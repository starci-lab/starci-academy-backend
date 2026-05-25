import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    LessonVideoEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    LessonVideoNotFoundException,
} from "@modules/exceptions"

@Injectable()
export class LessonVideoHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<LessonVideoEntity> {
        const lessonVideo = await this.entityManager.findOne(
            LessonVideoEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!lessonVideo) {
            throw new LessonVideoNotFoundException({
                id,
            })
        }
        return lessonVideo.toPlain<LessonVideoEntity>()
    }
}
