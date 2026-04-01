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
    ModuleTransformerService,
} from "../../../utils"
import type {
    EntityManager,
} from "typeorm"
import type {
    ModuleRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"

/**
 * Loads a single module from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class ModuleService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleTransformer: ModuleTransformerService,
    ) { }

    /**
     * Executes the module service.
     * @param request - The request object.
     * @param locale - The locale object.
     * @returns The module object.
     */
    async execute(
        {
            request,
            locale,
        }: ExecuteParams<ModuleRequest>,
    ): Promise<ModuleEntity> {
        const {
            id,
        } = request

        const moduleEntity = await this.entityManager.findOne(
            ModuleEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                    contents: {
                        translations: true,
                    },
                    previewContents: {
                        translations: true,
                    },
                    lessonVideos: {
                        translations: true,
                    },
                    submissions: true,
                },
            },
        )

        if (!moduleEntity) {
            throw new ModuleNotFoundException(
                {
                    id,
                },
            )
        }
        return this.moduleTransformer.transform(
            moduleEntity,
            locale,
        )
    }
}

