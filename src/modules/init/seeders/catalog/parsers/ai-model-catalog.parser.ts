import {
    Injectable,
} from "@nestjs/common"
import type {
    AppConfigAiModel,
} from "@modules/filesystem"
import {
    AiModelCategory,
    AiModelTask,
    ModelProvider,
} from "@modules/databases"
import {
    ContextLoaderService,
    CoerceMdScalarService,
    ExtractJsonFromMdService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    AiModelCatalogPathService,
} from "../path"
import {
    WinstonService,
} from "@modules/winston"
import type {
    AiModelCatalogMd,
    AiModelCatalogParsed,
    AiModelCatalogTranslation,
} from "./types"
import {
    AI_MODEL_CATALOG_ENTITY,
} from "./constants"

/**
 * Parses `.mount/data/ai-models/<index>-<slug>/{en,vi}.md` into catalog rows
 * (same mount markdown convention as courses).
 */
@Injectable()
export class AiModelCatalogParserService {
    constructor(
        private readonly aiModelCatalogPathService: AiModelCatalogPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Loads all indexed model definitions with their bilingual catalog text;
     * empty when mount folder has no entries.
     */
    async parseManyWithTranslations(): Promise<Array<AiModelCatalogParsed>> {
        const paths = await this.aiModelCatalogPathService.paths()
        const parsed: Array<AiModelCatalogParsed> = []

        for (const entry of paths) {
            const enRelativePath = `${entry.relativePath}/en.md`
            let raw: string
            try {
                raw = await this.contextLoaderService.load(
                    "ai-models",
                    enRelativePath,
                )
            } catch {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    AI_MODEL_CATALOG_ENTITY,
                    enRelativePath,
                    new Error("en.md missing or unreadable"),
                )
                continue
            }

            const enMd = this.extractJsonFromMdService.extract<AiModelCatalogMd>(raw)
            const model: AppConfigAiModel = {
                name: this.coerceMdScalarService.toRequiredString(
                    enMd.name,
                    entry.displayId,
                ),
                provider: this.coerceMdScalarService.toRequiredEnum(
                    enMd.provider,
                    ModelProvider,
                    ModelProvider.OpenAI,
                ),
                category: this.coerceMdScalarService.toRequiredEnum(
                    enMd.category,
                    AiModelCategory,
                    AiModelCategory.Economy,
                ),
                keysFilePath: this.coerceMdScalarService.toRequiredString(
                    enMd.keysFilePath,
                    "",
                ),
                priority: this.coerceMdScalarService.toRequiredNumber(
                    enMd.priority,
                    0,
                ),
                credit: this.coerceMdScalarService.toRequiredNumber(
                    enMd.credit,
                    0,
                ),
                weight: this.coerceMdScalarService.toRequiredNumber(
                    enMd.weight,
                    0,
                ),
                creditPerMTokIn: this.coerceMdScalarService.toRequiredNumber(
                    enMd.creditPerMTokIn,
                    0,
                ),
                creditPerMTokOut: this.coerceMdScalarService.toRequiredNumber(
                    enMd.creditPerMTokOut,
                    0,
                ),
                enabled: this.coerceMdScalarService.toRequiredBoolean(
                    enMd.enabled,
                    true,
                ),
                complimentary: this.coerceMdScalarService.toRequiredBoolean(
                    enMd.complimentary,
                    false,
                ),
                supportedTasks: parseSupportedTasks(enMd.supportedTasks),
            }

            if (!isValidAiModelRow(model)) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    AI_MODEL_CATALOG_ENTITY,
                    enRelativePath,
                    new Error("invalid ai-model en.md shape"),
                )
                continue
            }

            const en: AiModelCatalogTranslation = {
                label: this.coerceMdScalarService.toRequiredString(
                    enMd.label,
                    model.name,
                ),
                description: this.coerceMdScalarService.toRequiredString(
                    enMd.description,
                    "",
                ),
            }
            const vi = await this.loadTranslation(
                entry.relativePath,
                en,
            )

            parsed.push({
                model,
                en,
                vi,
            })
        }

        return parsed.sort(
            (prev, next) => next.model.priority - prev.model.priority,
        )
    }

    /** Loads all indexed model definitions; empty when mount folder has no entries. */
    async parseMany(): Promise<Array<AppConfigAiModel>> {
        const parsed = await this.parseManyWithTranslations()
        return parsed.map((entry) => entry.model)
    }

    /**
     * Reads `vi.md` catalog text; falls back to the English translation when the
     * file is missing or a field is empty.
     */
    private async loadTranslation(
        relativePath: string,
        fallback: AiModelCatalogTranslation,
    ): Promise<AiModelCatalogTranslation> {
        const viRelativePath = `${relativePath}/vi.md`
        let raw: string
        try {
            raw = await this.contextLoaderService.load(
                "ai-models",
                viRelativePath,
            )
        } catch {
            return fallback
        }

        const viMd = this.extractJsonFromMdService.extract<AiModelCatalogMd>(raw)
        return {
            label: this.coerceMdScalarService.toRequiredString(
                viMd.label,
                fallback.label,
            ),
            description: this.coerceMdScalarService.toRequiredString(
                viMd.description,
                fallback.description,
            ),
        }
    }
}

/**
 * Parse the `# supportedTasks` markdown heading (a comma/newline-separated list)
 * into a de-duplicated array of valid {@link AiModelTask} values. Unknown tokens
 * are dropped; a missing/blank heading yields an empty array.
 */
const parseSupportedTasks = (raw: unknown): Array<AiModelTask> => {
    if (typeof raw !== "string") {
        return []
    }
    const valid = new Set<string>(Object.values(AiModelTask))
    const seen = new Set<AiModelTask>()
    for (const token of raw.split(/[,\n]/)) {
        const value = token.trim().toLowerCase()
        if (valid.has(value)) {
            seen.add(value as AiModelTask)
        }
    }
    return [
        ...seen,
    ]
}

const isValidAiModelRow = (
    row: AppConfigAiModel,
): boolean => {
    if (!row.name || !row.provider || !row.category) {
        return false
    }
    if (!Object.values(ModelProvider).includes(row.provider)) {
        return false
    }
    if (!Object.values(AiModelCategory).includes(row.category)) {
        return false
    }
    if (row.keysFilePath.length === 0) {
        return false
    }
    if (Number.isNaN(row.priority)) {
        return false
    }
    if (typeof row.complimentary !== "boolean") {
        return false
    }
    return typeof row.enabled === "boolean"
}
