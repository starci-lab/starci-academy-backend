import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiModelTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model-translation.entity"
import {
    AiModelEntity,
} from "@modules/databases/postgresql/primary/entities/ai-model.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    AiModelCatalogParsed,
} from "../parsers/types"

/** Translatable catalog fields persisted into `ai_model_translations`. */
const TRANSLATION_FIELD = {
    Label: "label",
    Description: "description",
} as const

@Injectable()
/**
 * Persists parsed AI model catalog rows into `ai_models` + their localized
 * `ai_model_translations`. Upserts are keyed by the unique `(provider, name)`
 * pair so re-running the seeder is idempotent.
 */
export class AiModelInsertService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Upserts every parsed model, then RETIRES every enabled row the seed no
     * longer describes, and returns how many rows were written.
     *
     * The retire pass matters because the upsert is keyed on `(provider, name)`:
     * dropping a model from the mount folder would otherwise leave its row
     * behind, still `enabled`, and the balancer would keep routing to a model
     * nobody maintains any more -- including ids the provider has since removed,
     * which fail every attempt they are given.
     *
     * Rows are disabled rather than deleted so that transactions and grading
     * runs which reference the model by name keep resolving their history.
     *
     * @param entries - every model parsed from the mount folder.
     * @returns the number of rows upserted (retired rows are not counted).
     */
    async upsertMany(
        entries: Array<AiModelCatalogParsed>,
    ): Promise<number> {
        let upserted = 0
        for (const entry of entries) {
            await this.upsertOne(entry)
            upserted += 1
        }
        await this.retireModelsAbsentFromSeed(entries)
        return upserted
    }

    /**
     * Disable every currently-enabled model whose `(provider, name)` pair is not
     * present in the seed.
     *
     * @param entries - the models the seed describes; an empty seed retires nothing.
     */
    private async retireModelsAbsentFromSeed(
        entries: Array<AiModelCatalogParsed>,
    ): Promise<void> {
        // an empty parse is far more likely to mean "mount folder unreadable"
        // than "the operator meant to disable every model", so never act on it
        if (!entries.length) {
            return
        }
        const seeded = new Set(
            entries.map((entry) => `${entry.model.provider}:${entry.model.name}`),
        )
        const enabledRows = await this.entityManager.find(
            AiModelEntity,
            {
                where: {
                    enabled: true,
                },
                select: {
                    id: true,
                    name: true,
                    provider: true,
                },
            },
        )
        const staleIds = enabledRows
            .filter((row) => !seeded.has(`${row.provider}:${row.name}`))
            .map((row) => row.id)
        if (!staleIds.length) {
            return
        }
        await this.entityManager.update(
            AiModelEntity,
            staleIds,
            {
                enabled: false,
            },
        )
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
                    credit: model.credit,
                    weight: model.weight,
                    contextWindowTokens: model.contextWindowTokens ?? null,
                    priceCacheReadUsdPerMTok: model.priceCacheReadUsdPerMTok ?? null,
                    creditPerMTokCached: model.creditPerMTokCached ?? null,
                    priceInUsdPerMTok: model.priceInUsdPerMTok,
                    priceOutUsdPerMTok: model.priceOutUsdPerMTok,
                    creditPerMTokIn: model.creditPerMTokIn,
                    creditPerMTokOut: model.creditPerMTokOut,
                    enabled: model.enabled,
                    complimentary: model.complimentary,
                    supportedTasks: model.supportedTasks,
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
