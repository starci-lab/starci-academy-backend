import type {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"

/** payOS credentials stored in mounted {@link AppConfig} (see `.mount/config/app.yaml`). */
export interface AppConfigPayos {
    clientId: string
    checksumKey: string
}

/** `systemConfig.challenge` in mounted `app.yaml`. */
export interface AppConfigSystemChallenge {
    passThreshold: number
}

/** `systemConfig.task` in mounted `app.yaml`. */
export interface AppConfigSystemTask {
    passThreshold: number
}

/** `systemConfig` in mounted `app.yaml`. */
export interface AppConfigSystemConfig {
    challenge: AppConfigSystemChallenge
    task: AppConfigSystemTask
}

/**
 * One AI-model row defined in `app.yaml` under `ai.models`. Seeder upserts
 * each entry into the `ai_models` table; `UseApiService` reads from DB
 * (sorted by weight desc) at runtime.
 */
export interface AppConfigAiModel {
    /** Concrete model name accepted by the provider SDK (e.g. "gpt-4o-mini"). */
    name: string
    /** Provider that serves the model. */
    provider: ModelProvider
    /** Coarse cost/quality category — Economy / Balanced / Premium. */
    category: AiModelCategory
    /** Absolute / mount path to the newline-separated key file. */
    keysFilePath: string
    /** Fallback-chain priority. Higher = tried first by `UseApiService`. */
    priority: number
    /** Kill-switch — `false` removes the model from rotation without deleting the row. */
    enabled: boolean
}

/** `ai` section in mounted `app.yaml`. */
export interface AppConfigAi {
    /** Ordered catalog of models seeded into `ai_models`. */
    models: Array<AppConfigAiModel>
}

/** Root app config. */
export interface AppConfig {
    sentryDsn: string
    /** Optional; when set, overrides {@link envConfig}.payos for client id and checksum key. */
    payos: AppConfigPayos
    /** Optional public/system tuning (see `.mount/config/app.yaml`). */
    systemConfig: AppConfigSystemConfig
    /** AI catalog — seeded into `ai_models` at boot. */
    ai: AppConfigAi
}
