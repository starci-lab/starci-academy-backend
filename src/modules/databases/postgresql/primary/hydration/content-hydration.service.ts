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
    ContentBodyV2Entity,
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
            bodiesV2,
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
            // SCHEMA V2 per-language lesson bodies — locale variants live in the translation relation
            this.entityManager.find(
                ContentBodyV2Entity,
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
        hydratedContent.bodiesV2 = bodiesV2.map(
            (bodyV2) => bodyV2.toPlain<ContentBodyV2Entity>(),
        )
        return hydratedContent
    }
}
