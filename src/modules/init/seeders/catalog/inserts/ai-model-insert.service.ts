import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiModelEntity,
    AiModelTranslationEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import type {
    AiModelCatalogParsed,
} from "../parsers"

/** Translatable catalog fields persisted into `ai_model_translations`. */
const TRANSLATION_FIELD = {
    Label: "label",
    Description: "description",
} as const

/**
 * Persists parsed AI model catalog rows into `ai_models` + their localized
 * `ai_model_translations`. Upserts are keyed by the unique `(provider, name)`
 * pair so re-running the seeder is idempotent.
 */
@Injectable()
export class AiModelInsertService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Upserts every parsed model and returns how many rows were written.
     */
    async upsertMany(
        entries: Array<AiModelCatalogParsed>,
    ): Promise<number> {
        let upserted = 0
        for (const entry of entries) {
            await this.upsertOne(entry)
            upserted += 1
        }
        return upserted
    }

    /**
     * Find-or-create one model by `(provider, name)`, then refresh its scalar
     * columns and its `label` / `description` translations for en + vi.
     */
    private async upsertOne(
        entry: AiModelCatalogParsed,
    ): Promise<void> {
        const { model } = entry
        await this.entityManager.transaction(async (manager) => {
            const existing = await manager.findOne(
                AiModelEntity,
                {
                    where: {
                        provider: model.provider,
                        name: model.name,
                    },
                },
            )

            const saved = await manager.save(
                AiModelEntity,
                {
                    ...(existing ? {
                        id: existing.id 
                    } : {
                    }),
                    name: model.name,
                    provider: model.provider,
                    category: model.category,
                    keysFilePath: model.keysFilePath,
                    priority: model.priority,
                    enabled: model.enabled,
                    complimentary: model.complimentary,
                    defaultLocale: Locale.En,
                },
            )

            await this.upsertTranslations(
                manager,
                saved.id,
                entry,
            )
        })
    }

    /**
     * Upserts the `label` / `description` translation rows (en + vi) keyed by
     * the composite PK `(aiModelId, locale, field)`.
     */
    private async upsertTranslations(
        manager: EntityManager,
        aiModelId: string,
        entry: AiModelCatalogParsed,
    ): Promise<void> {
        const rows: Array<Partial<AiModelTranslationEntity>> = [
            {
                aiModelId,
                locale: Locale.En,
                field: TRANSLATION_FIELD.Label,
                value: entry.en.label,
            },
            {
                aiModelId,
                locale: Locale.En,
                field: TRANSLATION_FIELD.Description,
                value: entry.en.description,
            },
            {
                aiModelId,
                locale: Locale.Vi,
                field: TRANSLATION_FIELD.Label,
                value: entry.vi.label,
            },
            {
                aiModelId,
                locale: Locale.Vi,
                field: TRANSLATION_FIELD.Description,
                value: entry.vi.description,
            },
        ]

        await manager.save(
            AiModelTranslationEntity,
            rows,
        )
    }
}
