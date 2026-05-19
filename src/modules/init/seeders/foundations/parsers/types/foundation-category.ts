import type {
    ResolvedFilePath,
} from "../../../shared/path/resolver.service"

/** Ordinals locating `foundations/{categoryIndex}-{slug}/` on the mount. */
export interface ParseFoundationCategoryParams {
    paths: Array<ResolvedFilePath>
    categoryIndex: number
}
