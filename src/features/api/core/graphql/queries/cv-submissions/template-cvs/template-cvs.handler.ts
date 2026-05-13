import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
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
    ): Promise<Array<TemplateCVEntity>> {
        return this.entityManager.find(
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
    }
}
