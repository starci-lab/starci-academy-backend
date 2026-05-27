import type {
    MindMapNodeYaml,
} from "../../parsers/types"
import type {
    TreeRepository,
} from "typeorm"
import type {
    MindMapNodeEntity,
} from "@modules/databases"

/**
 * Input for {@link import("../mind-map-insert.service").MindMapInsertService.insert}.
 */
export interface InsertMindMapParams {
    /** Parent course id (already-persisted course this mind-map belongs to). */
    courseId: string
    /** The decoded YAML root produced by {@link import("../../parsers").MindMapParserService.parse}. */
    root: MindMapNodeYaml
}

/**
 * Internal recursion params for the private `insertNode` walker.
 * Lives in `types/` because NestJS service files must not declare inline interfaces.
 */
export interface InsertMindMapNodeParams {
    /** YAML node currently being inserted. */
    node: MindMapNodeYaml
    /** Persisted parent entity, or `null` for the root. */
    parent: MindMapNodeEntity | null
    /** Display order among siblings under the same parent. */
    orderIndex: number
    /** Owning course id (used for the `course` FK on the row). */
    courseId: string
    /** Pre-resolved lookup from `ModuleEntity.displayId` → `ModuleEntity.id` for entityRef linking. */
    moduleByDisplayId: Map<string, string>
    /** Tree repository handle reused across the recursion. */
    nodeRepo: TreeRepository<MindMapNodeEntity>
}
