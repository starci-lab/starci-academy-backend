import {
    ContentEntity,
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

@Injectable()
export class ContentQueryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly contentTransformer: ContentTransformerService,
    ) {}

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
                    references: {
                        translations: true,
                    },
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
        const fallbackLocale = content.defaultLocale ?? Locale.En
        this.contentTransformer.transform(
            content,
            locale,
            fallbackLocale,
        )
        return content
    }
}
