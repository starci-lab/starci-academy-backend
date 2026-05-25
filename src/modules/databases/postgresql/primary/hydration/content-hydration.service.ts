import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeEntity,
    CodeExplainingEntity,
    CodeImplementationEntity,
    ContentEntity,
    ContentReferenceEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    ContentNotFoundException,
} from "@modules/exceptions"

/**
 * Loads a content row and child tables as plain objects for CDN / Elasticsearch.
 */
@Injectable()
export class ContentHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<ContentEntity> {
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!content) {
            throw new ContentNotFoundException({
                id,
            })
        }
        const hydratedContent = content.toPlain<ContentEntity>()
        const [
            references,
            codeExplainings,
            codeImplementations,
            challenges,
        ] = await Promise.all([
            this.entityManager.find(
                ContentReferenceEntity,
                {
                    where: {
                        content: {
                            id: hydratedContent.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
            this.entityManager.find(
                CodeExplainingEntity,
                {
                    where: {
                        content: {
                            id: hydratedContent.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
            this.entityManager.find(
                CodeImplementationEntity,
                {
                    where: {
                        content: {
                            id: hydratedContent.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
            this.entityManager.find(
                ChallengeEntity,
                {
                    where: {
                        content: {
                            id: hydratedContent.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            ),
        ])
        hydratedContent.references = references.map(
            (reference) => reference.toPlain<ContentReferenceEntity>(),
        )
        hydratedContent.codeExplainings = codeExplainings.map(
            (row) => row.toPlain<CodeExplainingEntity>(),
        )
        hydratedContent.codeImplementations = codeImplementations.map(
            (row) => row.toPlain<CodeImplementationEntity>(),
        )
        hydratedContent.challenges = challenges.map(
            (challenge) => challenge.toPlain<ChallengeEntity>(),
        )
        return hydratedContent
    }
}
