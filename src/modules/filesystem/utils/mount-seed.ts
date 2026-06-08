import {
    existsSync,
    readFileSync,
} from "fs"
import {
    load as loadYaml,
} from "js-yaml"
import {
    envConfig,
} from "@modules/env"
import type {
    InitScopeConfig,
    SeedConfig,
} from "../types"

/**
 * Loader for the mounted `_seed.yaml` init-control file.
 *
 * Mirrors {@link getAppConfig}: read once from the mount path, parse via
 * `js-yaml`, and cache in memory. The git-sourced init generates its config
 * in-memory and applies it via {@link setRuntimeSeedConfig}, short-circuiting
 * the disk read.
 */
let runtimeSeedConfig: SeedConfig | undefined

/** Lazily-cached disk read (cleared only by {@link clearSeedConfigCache}). */
let cachedSeedConfig: SeedConfig | undefined

/** Lazily-cached disk read of `seed.yaml` (git-init scope override). */
let cachedInitScopeConfig: InitScopeConfig | undefined

/**
 * Active filesystem-context root override.
 *
 * The git-sourced init seeds from a temporary staging copy of the freshly
 * pulled `data` repo and only materializes `.contexts` after a successful
 * seed/sync. While set, the filesystem-context readers resolve files against
 * this staging root instead of the configured `context.path`.
 */
let runtimeContextRoot: string | undefined

/** Override the seed config in memory (init / tests). */
export const setRuntimeSeedConfig = (seedConfig: SeedConfig): void => {
    runtimeSeedConfig = seedConfig
}

/** Clear the runtime override (init / tests). */
export const clearRuntimeSeedConfig = (): void => {
    runtimeSeedConfig = undefined
}

/** Drop the cached disk read so the next call re-reads `_seed.yaml` (tests). */
export const clearSeedConfigCache = (): void => {
    cachedSeedConfig = undefined
}

/** Drop the cached `seed.yaml` read so the next call re-reads it (tests). */
export const clearInitScopeConfigCache = (): void => {
    cachedInitScopeConfig = undefined
}

/**
 * Read + parse the optional `seed.yaml` (git-init scope override).
 *
 * Returns an empty config when the file is absent, so the git init defaults to
 * diff-based scoping. Cached after the first read.
 *
 * @returns Parsed {@link InitScopeConfig} (empty when the file is missing)
 */
export const getInitScopeConfig = (): InitScopeConfig => {
    if (cachedInitScopeConfig) {
        return cachedInitScopeConfig
    }
    const path = envConfig().mountPath.config.initScope
    // a missing file means "no custom scope" → diff mode
    if (!existsSync(path)) {
        cachedInitScopeConfig = {
        }
        return cachedInitScopeConfig
    }
    const raw = readFileSync(path,
        "utf8")
    cachedInitScopeConfig = (loadYaml(raw) as InitScopeConfig | null) ?? {
    }
    return cachedInitScopeConfig
}

/** Point the filesystem-context readers at a staging root (init). */
export const setRuntimeContextRoot = (root: string): void => {
    runtimeContextRoot = root
}

/** Clear the staging-root override so reads fall back to `context.path` (init). */
export const clearRuntimeContextRoot = (): void => {
    runtimeContextRoot = undefined
}

/** The active staging root, or `undefined` when reads use `context.path`. */
export const getRuntimeContextRoot = (): string | undefined => runtimeContextRoot

/**
 * Read + parse the mounted `_seed.yaml`.
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
