import type {
    ModelProvider,
} from "@modules/databases"

/**
 * One provider/file pair the `KeyStoreService` should load at boot.
 *
 * Multiple `AiModelEntity` rows may share the same `keysFilePath` (e.g.
 * `gpt-4o` and `gpt-4o-mini` both pull from `open-api-keys.key`). The store
 * de-duplicates by this pair before reading the filesystem.
 */
export interface ProviderKeyFile {
    provider: ModelProvider
    keysFilePath: string
}
