import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CodeExplainingEntity,
} from "../entities/code-explaining.entity"
import {
    CodeImplementationEntity,
} from "../entities/code-implementation.entity"
import {
    ContentBodyEntity,
} from "../entities/content-body.entity"
import {
    ContentEntity,
} from "../entities/content.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    ChallengeHydrationService,
} from "./challenge-hydration.service"

@Injectable()
/**
 * Loads a content row and child tables as plain objects for CDN / Elasticsearch.
 */
export class ContentHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeHydrationService: ChallengeHydrationService,
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
            codeExplainings,
            codeImplementations,
            challenges,
            bodies,
        ] = await Promise.all([
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
                        sortIndex: "ASC",
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
                        sortIndex: "ASC",
                    },
                },
            ),
            this.challengeHydrationService.loadByContentId(hydratedContent.id),
            // SCHEMA V2 per-language lesson bodies -- locale variants live in the translation relation
            this.entityManager.find(
                ContentBodyEntity,
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
                        sortIndex: "ASC",
                    },
                },
            ),
        ])
        hydratedContent.codeExplainings = codeExplainings.map(
            (row) => row.toPlain<CodeExplainingEntity>(),
        )
        hydratedContent.codeImplementations = codeImplementations.map(
            (row) => row.toPlain<CodeImplementationEntity>(),
        )
        hydratedContent.challenges = challenges
        hydratedContent.bodies = bodies.map(
            (body) => body.toPlain<ContentBodyEntity>(),
        )
        return hydratedContent
    }
}
