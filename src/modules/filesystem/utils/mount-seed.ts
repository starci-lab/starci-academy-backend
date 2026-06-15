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
    InitConfig,
    SeedConfig,
} from "../types"

/**
 * Active seed/sync control config.
 *
 * The git-sourced init builds the full {@link SeedConfig} in-memory from
 * `seed.yaml` and applies it via {@link setRuntimeSeedConfig}. When no override
 * is set (e.g. a stray read outside the init window), {@link getSeedConfig}
 * falls back to a fully-disabled default so nothing seeds accidentally.
 */
let runtimeSeedConfig: SeedConfig | undefined

/** Fully-disabled baseline returned when no runtime override is active. */
const DEFAULT_SEED_CONFIG: SeedConfig = {
    seeders: {
        enabled: false,
        courses: {
            enabled: false,
            tracks: {
            },
            flashcard: {
                enabled: false,
                linkContents: false,
            },
        },
        cv: false,
        foundations: false,
        headhunting: false,
        aiModels: false,
        subscriptions: false,
        codingProblems: false,
        advertisements: false,
        changelog: false,
    },
    synchronizers: {
        enabled: false,
        reindex: [],
        courses: {
        },
        cv: {
            cdn: false,
            elasticsearch: false,
        },
        foundations: {
            cdn: false,
            elasticsearch: false,
        },
        headhunting: {
            cdn: false,
            elasticsearch: false,
        },
        flashcards: {
            cdn: false,
            elasticsearch: false,
        },
        codingProblems: {
            cdn: false,
            elasticsearch: false,
        },
    },
}

/** Lazily-cached disk read of `seed.yaml` (the `InitConfig` control surface). */
let cachedInitConfig: InitConfig | undefined

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

/** Drop the cached `seed.yaml` read so the next call re-reads it (tests). */
export const clearInitConfigCache = (): void => {
    cachedInitConfig = undefined
}

/**
 * Read + parse the optional `seed.yaml` (the {@link InitConfig} control surface).
 *
 * Returns an empty config when the file is absent, so the git init defaults to
 * diff-based scoping. Cached after the first read.
 *
 * @returns Parsed {@link InitConfig} (empty when the file is missing)
 */
export const getInitConfig = (): InitConfig => {
    if (cachedInitConfig) {
        return cachedInitConfig
    }
    const path = envConfig().mountPath.config.initScope
    // a missing file means "no overrides" → diff mode
    if (!existsSync(path)) {
        cachedInitConfig = {
        }
        return cachedInitConfig
    }
    const raw = readFileSync(path,
        "utf8")
    cachedInitConfig = (loadYaml(raw) as InitConfig | null) ?? {
    }
    return cachedInitConfig
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
 * Resolve the active {@link SeedConfig}.
 *
 * Prefers an explicit argument, then the in-memory runtime override the
 * git-init sets, and finally a fully-disabled default.
 *
 * @param seedConfig - optional pre-built config that wins over everything
 * @returns The active {@link SeedConfig}
 */
export const getSeedConfig = (seedConfig?: SeedConfig): SeedConfig => {
    if (seedConfig) {
        return seedConfig
    }
    if (runtimeSeedConfig) {
        return runtimeSeedConfig
    }
    return DEFAULT_SEED_CONFIG
}
