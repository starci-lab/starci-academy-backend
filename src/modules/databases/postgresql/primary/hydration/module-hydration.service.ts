import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeEntity,
    ContentEntity,
    ModuleEntity,
    PreviewContentEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    ModuleNotFoundException,
} from "@modules/exceptions"

@Injectable()
/**
 * Loads a module with preview contents and lessons (plus nested challenges)
 * so the learn shell can render the module tree from one hydration call.
 */
export class ModuleHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<ModuleEntity> {
        const moduleRow = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!moduleRow) {
            throw new ModuleNotFoundException({
                id,
            })
        }
        const hydratedModule = moduleRow.toPlain<ModuleEntity>()
        const previewContents = await this.entityManager.find(
            PreviewContentEntity,
            {
                where: {
                    module: {
                        id: hydratedModule.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        hydratedModule.previewContents = previewContents.map(
            (previewContent) => previewContent.toPlain<PreviewContentEntity>(),
        )
        const contents = await this.entityManager.find(
            ContentEntity,
            {
                where: {
                    module: {
                        id: hydratedModule.id,
                    },
                },
                relations: {
                    translations: true,
                    challenges: true,
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        hydratedModule.contents = contents.map(
            (content) => {
                const hydratedContent = content.toPlain<ContentEntity>()
                hydratedContent.challenges = content.challenges?.map(
                    (challenge) => challenge.toPlain<ChallengeEntity>(),
                )
                return hydratedContent
            },
        )
        return hydratedModule
    }
}
