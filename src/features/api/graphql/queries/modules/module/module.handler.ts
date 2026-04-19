import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
} from "@modules/databases"
import {
    ModuleNotFoundException,
} from "@modules/exceptions"
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
    ModuleTransformerService,
} from "../../../utils"
import {
    ModuleQuery,
} from "./module.query"

@QueryHandler(ModuleQuery)
@Injectable()
export class ModuleHandler
    extends ICQRSHandler<ModuleQuery, ModuleEntity>
    implements IQueryHandler<ModuleQuery, ModuleEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleTransformer: ModuleTransformerService,
    ) {
        super()
    }

    protected override async process(query: ModuleQuery): Promise<ModuleEntity> {
        const {
            request,
            locale,
        } = query.params
        const {
            id,
            displayId,
        } = request

        const moduleEntity = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    ...(id && {
                        id,
                    }),
                    ...(displayId && {
                        displayId,
                    }),
                },
                relations: {
                    translations: true,
                    previewContents: {
                        translations: true,
                    },
                },
            },
        )

        if (!moduleEntity) {
            throw new ModuleNotFoundException({
                ...(id && {
                    id,
                }),
                ...(displayId && {
                    displayId,
                }),
            })
        }

        return this.moduleTransformer.transform(
            moduleEntity,
            locale,
        )
    }
}
