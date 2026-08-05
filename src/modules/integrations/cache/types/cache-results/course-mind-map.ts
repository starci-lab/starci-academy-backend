import type {
    MindMapNodeEntityType,
} from "@modules/databases/postgresql/primary/enums/mind-map-node-entity-type"

/** `@xyflow/react` node coordinate cached for a course mind-map node. */
export interface CourseMindMapCacheNodePosition {
    /** Horizontal coordinate in flow units. */
    x: number
    /** Vertical coordinate in flow units. */
    y: number
}

/** One cached cross-link from a concept node to a learning surface. */
export interface CourseMindMapCacheNodeLink {
    /** Surface kind this link opens. */
    kind: MindMapNodeEntityType
    /** Resolved id of the target entity, or null when the slug did not resolve. */
    entityId: string | null
    /** Owning module id -- set for lesson/challenge links. */
    moduleId: string | null
    /** Authored mount slug of the target. */
    displayId: string | null
}

/** Cached payload carried on a course mind-map node (label + navigation refs). */
export interface CourseMindMapCacheNodeData {
    /** Human-facing node label (concept keyword, or course / module / lesson title). */
    label: string
    /** What the node represents (concept `custom`, or course / module / lesson). */
    kind: MindMapNodeEntityType
    /** Id of the represented entity (course/module/content), null for concept nodes. */
    entityId: string | null
    /** Owning module id -- set on lesson nodes so the client can build the lesson URL. */
    moduleId: string | null
    /** Stable mount slug (displayId) of the represented entity. */
    displayId: string | null
    /** Cross-links to surfaces teaching/drilling/testing this concept (authored nodes). */
    links: Array<CourseMindMapCacheNodeLink>
    /** Optional one-line gloss (authored concept nodes). */
    desc: string | null
}

/** Cached `@xyflow/react`-shaped course mind-map node. */
export interface CourseMindMapCacheNode {
    /** Unique node id (e.g. `course-<id>`, `module-<id>`, `lesson-<id>`). */
    id: string
    /** Optional client node type key. */
    type: string | null
    /** Computed layout coordinate. */
    position: CourseMindMapCacheNodePosition
    /** Node payload (label + navigation refs). */
    data: CourseMindMapCacheNodeData
}

/** Cached `@xyflow/react`-shaped course mind-map edge. */
export interface CourseMindMapCacheEdge {
    /** Unique edge id (e.g. `<sourceId>--<targetId>`). */
    id: string
    /** Source node id. */
    source: string
    /** Target node id. */
    target: string
    /** Optional client edge type key. */
    type: string | null
    /** Whether the edge animates (decorative). */
    animated: boolean | null
}

/**
 * Redis-cached computed course mind-map graph (nodes + edges), keyed by course id/slug. Structurally
 * identical to the GraphQL `CourseMindMapResponseData` so it round-trips without conversion.
 */
export interface CourseMindMapCacheResult {
    /** Graph nodes (course root + module + lesson nodes). */
    nodes: Array<CourseMindMapCacheNode>
    /** Graph edges (course->module, module->lesson). */
    edges: Array<CourseMindMapCacheEdge>
}
