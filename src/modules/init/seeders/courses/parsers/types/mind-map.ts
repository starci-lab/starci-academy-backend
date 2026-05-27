/**
 * Input for {@link import("../mind-map.service").MindMapParserService.parse}.
 *
 * The parser does not need a course id because mind-map node UUIDs are not
 * deterministic — the insert layer wipes and recreates the whole tree per run
 * (see {@link import("../../inserts").MindMapInsertService}).
 */
export interface ParseMindMapParams {
    /**
     * Mount-relative path of the course directory (e.g. `0-fullstack-mastery`).
     * Used to locate `mind-map.yaml` inside the course folder.
     */
    courseRelativePath: string
}

/**
 * Untyped tree shape decoded from `mind-map.yaml`.
 *
 * Authors write nested `children:` lists; depth is unbounded.
 * Optional `module` links a node to a real {@link import("@modules/databases").ModuleEntity}
 * via its `displayId` — the insert layer resolves the displayId to a real UUID and
 * stores it as `entityRef` on the node.
 */
export interface MindMapNodeYaml {
    /** Text displayed on the node. */
    label: string
    /** Optional color token (hex code, tailwind class, or palette key). */
    color?: string
    /** Optional `ModuleEntity.displayId` to link this node to a real module. */
    module?: string
    /** Direct children of this node; ordered by their position in the YAML list. */
    children?: Array<MindMapNodeYaml>
}
