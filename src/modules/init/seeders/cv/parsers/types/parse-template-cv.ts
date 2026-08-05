import type {
    ResolvedFilePath,
} from "../../../shared/path/types"

/** * Locates one template directory in the resolved path list (same shape as {@link ParseContentParams}).
 */
export interface ParseTemplateCvParams {
    /**
     * Paths returned by {@link TemplateCvPathService.paths}.
     */
    paths: Array<ResolvedFilePath>
    /**
     * `orderIndex` of the template folder under `cv/` (matches {@link ResolvedFilePath.orderIndex}).
     */
    templateIndex: number
}
