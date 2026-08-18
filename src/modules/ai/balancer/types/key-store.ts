import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/**
 * One provider/file pair the `KeyStoreService` should load at boot.
 *
 * Multiple `AiModelEntity` rows may share the same `keysFilePath` (e.g.
 * `gpt-4o` and `gpt-4o-mini` both pull from `openai-api-keys.key`). The store
 * de-duplicates by this pair before reading the filesystem.
 */
export interface ProviderKeyFile {
    provider: ModelProvider
    keysFilePath: string
}

/** Params for {@link KeyStoreService.reloadProvider}. */
export interface ReloadProviderParams {
    /** Provider whose pool is being reloaded. */
    provider: ModelProvider
    /** Every catalog-declared `keysFilePath` to load for this provider. */
    paths: Array<string>
}

/**
 * One key value read from a mount file, tagged with the file it came from --
 * the pre-hydration shape {@link KeyStoreService.reloadProvider} works with
 * before it is expanded into a full {@link KeyState}.
 */
export interface TaggedApiKey {
    value: string
    keysFilePath: string
}
