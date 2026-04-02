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
 * Loads module shell data (no contents, lesson videos, or challenges — fetch those by id).
 */
@Injectable()
export class ModuleService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly moduleTransformer: ModuleTransformerService,
    ) { }

    async execute(
        {
            request,
            locale,
        }: ExecuteParams<ModuleRequest>,
    ): Promise<ModuleEntity> {
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
                    submissions: true,
                },
            },
        )

        if (!moduleEntity) {
            throw new ModuleNotFoundException(
                {
                    ...(
                        id && {
                            id,
                        }
                    ),
                    ...(
                        displayId && {
                            displayId,
                        }
                    ),
                },
            )
        }

        moduleEntity.contents = []
        moduleEntity.lessonVideos = []
        moduleEntity.challenges = []

        return this.moduleTransformer.transform(
            moduleEntity,
            locale,
        )
    }
}
