import {
    ContentEntity,
    ContentReferenceEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ContentNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import {
    ContentTransformerService,
} from "../../../utils"
import type {
    EntityManager,
} from "typeorm"
import type {
    ContentRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"

/**
 * Service for querying content.
 */
@Injectable()
export class ContentQueryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly contentTransformer: ContentTransformerService,
    ) {}

    /**
     * Entry: returns one content by primary id.
     *
     * @param request - Wrapper with content id
     * @param request.id - Content id
     * @throws {ContentNotFoundException} When no content exists for `id`.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<ContentRequest>,
    ): Promise<ContentEntity> {
        const content = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    id: request.id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!content) {
            throw new ContentNotFoundException(
                {
                    id: request.id,
                },
            )
        }
        content.references = await this.entityManager.find(
            ContentReferenceEntity,
            {
                where: {
                    contentId: content.id,
                },
                relations: {
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        this.contentTransformer.transform(
            content,
            locale,
            content.defaultLocale ?? Locale.En,
        )
        return content
    }
}
