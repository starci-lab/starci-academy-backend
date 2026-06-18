import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ContentEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
} from "@modules/databases"
import {
    ElasticsearchQueryBuilder,
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    estypes,
} from "@elastic/elasticsearch"
import {
    ContentsQuery,
} from "./contents.query"
import {
    ContentsResponseData,
} from "./graphql-types"

@QueryHandler(ContentsQuery)
@Injectable()
export class ContentsHandler
    extends ICQRSHandler<ContentsQuery, ContentsResponseData>
    implements IQueryHandler<ContentsQuery, ContentsResponseData> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: ContentsQuery,
    ): Promise<ContentsResponseData> {
        const {
            request: {
                moduleId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                    search,
                },
            },
            locale,
            user,
        } = query.params

        const sort = sorts.map((sortItem) => ({
            [sortItem.by]: {
                order: sortItem.order.toLowerCase() as estypes.SortOrder,
            } as estypes.FieldSort,
        })) as Array<estypes.SortCombinations>

        const esQuery = ElasticsearchQueryBuilder.buildSearchQuery({
            filters: [
                {
                    term: {
                        // moduleId is mapped as a pure keyword → query it directly (no `.keyword` subfield)
                        moduleId,
                    },
                },
            ],
            search,
            searchFields: ["title^3",
                "description",
                "body"],
        })

        const response = await this.elasticsearch.client.search<ContentEntity>({
            index: this.elasticsearch.indicateName({
                entity: ContentEntity.name,
                locale,
            }),
            query: esQuery,
            sort,
            from: pageNumber * limit,
            size: limit,
        })
        const total = response.hits.total
        const count = typeof total === "number" ? total : total?.value || 0
        const data = response.hits.hits.map((hit) => hit._source as ContentEntity)

        // Determine whether this viewer is entitled to premium content.
        // All items in a module share the same course, so a single entitlement
        // check covers the entire page.
        const entitled = await this.resolveEntitlement(
            moduleId,
            user?.id,
        )

        // Apply the premium gate to every non-entitled premium item so the FE
        // receives a truncated teaser and can show the purchase paywall overlay.
        for (const content of data) {
            if (content.isPremium && !entitled) {
                // Truncate the body and strip premium-only code assets.
                this.lockPremiumContent(content)
                // Keep isPremium=true so the FE knows this item is locked for the viewer.
                content.isPremium = true
            } else {
                // Viewer is either entitled or content is free — signal full access.
                content.isPremium = false
            }
        }

        return {
            count,
            data,
        }
    }

    /**
     * Resolves whether the viewer is entitled to full premium content for the
     * given module's course. Returns true for unauthenticated/no-user cases
     * where all content is free (non-premium items are always accessible).
     * @param moduleId The module id to look up the owning course.
     * @param userId The active viewer's user id, undefined when anonymous.
     */
    private async resolveEntitlement(
        moduleId: string,
        userId: string | undefined,
    ): Promise<boolean> {
        // Without a user id there is no entitlement to premium content.
        if (!userId) {
            return false
        }

        // Resolve the owning course id from the module row.
        const moduleRow = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id: moduleId,
                },
                select: {
                    id: true,
                    courseId: true,
                },
            },
        )

        // If the module can't be found, be conservative and deny premium access.
        if (!moduleRow?.courseId) {
            return false
        }

        // An active enrollment in the owning course grants full access.
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    // userId / courseId are @RelationId (virtual, not queryable) —
                    // filter through the relations' real FK columns instead
                    user: {
                        id: userId,
                    },
                    course: {
                        id: moduleRow.courseId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )

        return Boolean(enrollment)
    }

    /**
     * Truncates a premium content item in place to a short blurred teaser and
     * strips code assets, so a trial viewer sees only a brief preview behind
     * the purchase paywall overlay.
     * @param content Parsed content entity to mutate.
     */
    private lockPremiumContent(
        content: ContentEntity,
    ): void {
        /** Returns the leading slice of a markdown string as a preview teaser. */
        const preview = (text: string | null): string => {
            if (!text) {
                return ""
            }
            // Keep only the first 1 200 characters — enough for context, not full disclosure.
            const limit = 1200
            if (text.length <= limit) {
                return text
            }
            let sliced = text.slice(0,
                limit)
            // If the cut landed INSIDE a fenced code block (odd count of ``` fences), the markdown
            // would have a dangling open fence — e.g. a half mermaid diagram that fails to parse on
            // the FE. Drop everything from the last unclosed fence so the teaser stays valid markdown.
            if ((sliced.match(/```/g)?.length ?? 0) % 2 === 1) {
                sliced = sliced.slice(0,
                    sliced.lastIndexOf("```"))
            }
            return `${sliced.trimEnd()}\n\n...`
        }

        // Truncate the legacy SCHEMA V1 scalar body field.
        content.body = preview(content.body)

        // Truncate SCHEMA V2 per-language body objects and their locale translations.
        for (const body of content.bodies ?? []) {
            body.body = preview(body.body)
            for (const translation of body.translations ?? []) {
                translation.body = preview(translation.body)
            }
        }

        // Strip premium-only code assets — these should never reach a trial viewer.
        content.codeExplainings = []
        content.codeImplementations = []
    }
}
