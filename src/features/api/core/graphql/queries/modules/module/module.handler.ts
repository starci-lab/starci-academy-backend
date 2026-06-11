import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
    ModuleResolverService,
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
        private readonly moduleResolver: ModuleResolverService,
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
                    contents: {
                        translations: true,
                    },
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    displayId: true,
                    orderIndex: true,
                    sortIndex: true,
                    defaultLocale: true,
                    numContents: true,
                    previewContents: {
                        id: true,
                        text: true,
                        orderIndex: true,
                        sortIndex: true,
                    },
                    contents: {
                        id: true,
                        title: true,
                        description: true,
                        orderIndex: true,
                        sortIndex: true,
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

        return this.moduleResolver.transform(
            moduleEntity,
            locale,
        )
    }
}
