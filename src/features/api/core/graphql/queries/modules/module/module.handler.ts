import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ModuleResolverService,
} from "@modules/databases/postgresql/primary/resolvers/module-resolver.service"
import {
    ModuleNotFoundException,
} from "@modules/platform/exceptions/errors/courses/module-not-found"
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
/**
 * Loads one module (with nested contents / preview contents) from Postgres by
 * id or display id, then localizes via `ModuleResolverService`.
 */
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
            // the transport leaves locale unset for locale-agnostic callers; English is the base locale
            locale = Locale.En,
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
                    contentTier: true,
                    isPremium: true,
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
