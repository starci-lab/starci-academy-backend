import {
    readFileSync,
} from "fs"
import {
    load as loadYaml,
} from "js-yaml"
import {
    envConfig,
} from "@modules/env"
import type {
    SeedConfig,
    SeedV2Config,
} from "../types"

/**
 * Loader for the mounted `seed.yaml` init-control file.
 *
 * Mirrors {@link getAppConfig}: read once from the mount path, parse via
 * `js-yaml`, and cache in memory. Tests / in-memory overrides short-circuit
 * the disk read via {@link setRuntimeSeedConfig}.
 */
let runtimeSeedConfig: SeedConfig | undefined

/** Lazily-cached disk read (cleared only by {@link clearSeedConfigCache}). */
let cachedSeedConfig: SeedConfig | undefined

/** Lazily-cached disk read of `seed-v2.yaml` (InitV2 minimal config). */
let cachedSeedV2Config: SeedV2Config | undefined

/** Override the seed config in memory (tests). */
export const setRuntimeSeedConfig = (seedConfig: SeedConfig): void => {
    runtimeSeedConfig = seedConfig
}

/** Clear the runtime override (tests). */
export const clearRuntimeSeedConfig = (): void => {
    runtimeSeedConfig = undefined
}

/** Drop the cached disk read so the next call re-reads `seed.yaml` (tests). */
export const clearSeedConfigCache = (): void => {
    cachedSeedConfig = undefined
}

/** Drop the cached `seed-v2.yaml` read so the next call re-reads it (tests). */
export const clearSeedV2ConfigCache = (): void => {
    cachedSeedV2Config = undefined
}

/**
 * Read + parse the mounted `seed-v2.yaml` (the InitV2 control file).
 *
 * Separate from {@link getSeedConfig}: InitV2 uses this as its base config and
 * applies it via {@link setRuntimeSeedConfig}, leaving legacy `seed.yaml` for
 * the legacy InitModule. Cached after the first read.
 *
 * @returns Parsed {@link SeedV2Config}
 */
export const getSeedV2Config = (): SeedV2Config => {
    if (cachedSeedV2Config) {
        return cachedSeedV2Config
    }
    const raw = readFileSync(
        envConfig().mountPath.config.seedV2,
        "utf8",
    )
    cachedSeedV2Config = loadYaml(raw) as SeedV2Config
    return cachedSeedV2Config
}

/**
 * Read + parse the mounted `seed.yaml`.
 *
 * @param seedConfig - optional pre-built config that skips the disk read
 * @returns Parsed {@link SeedConfig}
 */
export const getSeedConfig = (seedConfig?: SeedConfig): SeedConfig => {
    if (seedConfig) {
        return seedConfig
    }
    if (runtimeSeedConfig) {
        return runtimeSeedConfig
    }
    if (cachedSeedConfig) {
        return cachedSeedConfig
    }
    const raw = readFileSync(
        envConfig().mountPath.config.seed,
        "utf8",
    )
    cachedSeedConfig = loadYaml(raw) as SeedConfig
    return cachedSeedConfig
}
