import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    TemplateCVEntity,
} from "@modules/databases/postgresql/primary/entities/template-cv.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
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
/**
 * Lists every CV review template ordered by `sortIndex`, overlaying
 * title/description/body from the requested locale (falls back to the
 * entity's stored English fields).
 */
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
                    sortIndex: "ASC",
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
