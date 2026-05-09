import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    PersonalProjectContextEntity,
    PersonalProjectContextTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"

/**
 * Inserts/updates/deletes personal_project_contexts and
 * personal_project_context_translations tables.
 */
@Injectable()
export class PersonalProjectContextInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single personal project context and its translations.
     */
    async insert(
        context: DeepPartial<PersonalProjectContextEntity>
    ): Promise<void> {
        const contextId = context.id as string

        /** 1. Upsert the context row (strip nested relations) */
        const {
            translations,
            ...rest
        } = context

        await this.upsertService.upsertUuid(
            PersonalProjectContextEntity,
            [rest],
        )

        /** 2. Upsert context translations */
        if (translations) {
            await this.upsertService.upsertTranslation(
                PersonalProjectContextTranslationEntity,
                translations,
                {
                    personalProjectContextId: contextId
                },
            )
        }
    }

    /**
     * Delete stale contexts for a course.
     */
    async deleteStale(
        ids: Array<string>,
        courseId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<PersonalProjectContextEntity>(
            PersonalProjectContextEntity,
            ids,
            {
                course: {
                    id: courseId
                }
            },
        )
    }
}
