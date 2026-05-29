import type {
    ResolvedFilePath,
} from "../../../shared/path/types"

/** Ordinals locating `{category}/foundations/{foundationIndex}-{slug}/` on the mount. */
export interface ParseFoundationParams {
    paths: Array<ResolvedFilePath>
    foundationIndex: number
    categoryIndex: number
}

/** Ordinals locating `{category}/foundations/` on the mount. */
export interface ParseFoundationManyParams {
    categoryRelativePath: string
    categoryIndex: number
}
