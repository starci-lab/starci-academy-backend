import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    TemplateCVEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
import {
    TemplateCvsQuery,
} from "./template-cvs.query"

@QueryHandler(TemplateCvsQuery)
@Injectable()
export class TemplateCvsHandler
    extends ICQRSHandler<TemplateCvsQuery, Array<TemplateCVEntity>>
    implements IQueryHandler<TemplateCvsQuery, Array<TemplateCVEntity>> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: TemplateCvsQuery,
    ): Promise<Array<TemplateCVEntity>> {
        const templates = await this.entityManager.find(
            TemplateCVEntity,
            {
                order: {
                    orderIndex: "ASC",
                },
                relations: [
                    "translations",
                ],
            },
        )

        const locale = query.params.locale ?? Locale.En
        return templates.map((template) => {
            const translations = template.translations ?? []
            for (const field of [
                "title",
                "description",
                "body",
            ] as const) {
                const translation = translations.find((item) => item.locale === locale && item.field === field)
                if (translation?.value) {
                    template[field] = translation.value
                }
            }
            return template
        })
    }
}
