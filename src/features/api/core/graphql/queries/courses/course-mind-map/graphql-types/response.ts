import {
    Field,
    Float,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeMindMapNodeEntityType,
    MindMapNodeEntityType,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * `@xyflow/react` node coordinate. Server computes a tidy left-to-right tree layout so the client
 * can render without an extra layout pass.
 */
@ObjectType({
    description: "x/y coordinate of a mind-map node (@xyflow/react `position`).",
})
export class MindMapNodePosition {
    /** Horizontal coordinate in flow units. */
    @Field(() => Float,
        {
            description: "Horizontal coordinate." 
        })
        x: number

    /** Vertical coordinate in flow units. */
    @Field(() => Float,
        {
            description: "Vertical coordinate." 
        })
        y: number
}

/**
 * Payload carried on each node (`@xyflow/react` node `data`). Holds the label plus the ids the
 * client needs to build a navigation href (kind + entity/module ids + slug).
 */
@ObjectType({
    description: "Custom payload of a mind-map node (label + navigation refs).",
})
export class MindMapNodeData {
    /** Human-facing node label (course / module / lesson title). */
    @Field(() => String,
        {
            description: "Node label shown in the graph." 
        })
        label: string

    /** What the node represents — drives the click target on the client. */
    @Field(() => GraphQLTypeMindMapNodeEntityType,
        {
            description: "Node kind (course / module / lesson).",
        })
        kind: MindMapNodeEntityType

    /** Primary-key id of the entity this node represents (course/module/content id). */
    @Field(() => ID,
        {
            nullable: true,
            description: "Id of the represented entity (course/module/content).",
        })
        entityId: string | null

    /** Owning module id — present on lesson nodes so the client can build the lesson URL. */
    @Field(() => ID,
        {
            nullable: true,
            description: "Owning module id (set on lesson nodes for URL building).",
        })
        moduleId: string | null

    /** Stable mount slug of the entity (course/module/content displayId). */
    @Field(() => String,
        {
            nullable: true,
            description: "Stable mount slug (displayId) of the represented entity.",
        })
        displayId: string | null

    /**
     * Surfaces this node links to. Populated on AUTHORED concept nodes (a keyword can be taught
     * by a lesson, drilled by a deck and tested by an interview bank at once); empty on the
     * derived module graph, whose nodes carry their single target in `entityId` above.
     */
    @Field(() => [MindMapNodeLink],
        {
            description: "Cross-links to the surfaces that teach/drill/test this concept.",
        })
        links: Array<MindMapNodeLink>

    /** Optional one-line gloss shown on hover (authored concept nodes only). */
    @Field(() => String,
        {
            nullable: true,
            description: "Optional one-line gloss (authored concept nodes).",
        })
        desc: string | null
}

/**
 * ONE cross-link from a concept node to a learning surface that teaches / drills / tests it.
 * A concept typically cuts across several surfaces (a lesson to learn it, a flashcard deck to
 * drill it, an interview bank to be tested on it), so concept nodes carry a LIST of these —
 * unlike the derived module graph, whose nodes point at a single entity.
 */
@ObjectType({
    description: "A cross-link from a concept node to a learning surface.",
})
export class MindMapNodeLink {
    /** Which surface kind this link opens. */
    @Field(() => GraphQLTypeMindMapNodeEntityType,
        {
            description: "Surface kind (lesson / challenge / milestone / flashcard / interview).",
        })
        kind: MindMapNodeEntityType

    /** Resolved primary-key id of the target, or null when the slug did not resolve. */
    @Field(() => ID,
        {
            nullable: true,
            description: "Resolved id of the target entity (null when unresolved).",
        })
        entityId: string | null

    /** Owning module id — set for lesson/challenge links so the client can build the URL. */
    @Field(() => ID,
        {
            nullable: true,
            description: "Owning module id (set on lesson/challenge links for URL building).",
        })
        moduleId: string | null

    /** Authored mount slug of the target (kept even when unresolved, for debugging). */
    @Field(() => String,
        {
            nullable: true,
            description: "Authored mount slug (displayId) of the target.",
        })
        displayId: string | null
}

/**
 * A single graph node in `@xyflow/react` shape (`{ id, type, position, data }`).
 */
@ObjectType({
    description: "A mind-map node in @xyflow/react node shape.",
})
export class MindMapNode {
    /** Unique node id (e.g. `course-<id>`, `module-<id>`, `lesson-<id>`). */
    @Field(() => String,
        {
            description: "Unique node id." 
        })
        id: string

    /** Optional custom node type registered on the client `nodeTypes` map. */
    @Field(() => String,
        {
            nullable: true,
            description: "Optional client node type key.",
        })
        type: string | null

    /** Computed layout coordinate. */
    @Field(() => MindMapNodePosition,
        {
            description: "Computed node position." 
        })
        position: MindMapNodePosition

    /** Node payload (label + navigation refs). */
    @Field(() => MindMapNodeData,
        {
            description: "Node data payload." 
        })
        data: MindMapNodeData
}

/**
 * A single graph edge in `@xyflow/react` shape (`{ id, source, target }`).
 */
@ObjectType({
    description: "A mind-map edge in @xyflow/react edge shape.",
})
export class MindMapEdge {
    /** Unique edge id (e.g. `<sourceId>--<targetId>`). */
    @Field(() => String,
        {
            description: "Unique edge id." 
        })
        id: string

    /** Source node id. */
    @Field(() => String,
        {
            description: "Source node id." 
        })
        source: string

    /** Target node id. */
    @Field(() => String,
        {
            description: "Target node id." 
        })
        target: string

    /** Optional client edge type key. */
    @Field(() => String,
        {
            nullable: true,
            description: "Optional client edge type key.",
        })
        type: string | null

    /** Whether the edge animates (decorative). */
    @Field(() => Boolean,
        {
            nullable: true,
            description: "Whether the edge animates.",
        })
        animated: boolean | null
}

/**
 * Computed mind-map graph payload — nodes + edges ready to feed straight into `@xyflow/react`.
 */
@ObjectType({
    description: "Computed course mind-map graph (nodes + edges) for @xyflow/react.",
})
export class CourseMindMapResponseData {
    /** Graph nodes (course root + module + lesson nodes). */
    @Field(() => [MindMapNode],
        {
            description: "Graph nodes." 
        })
        nodes: Array<MindMapNode>

    /** Graph edges (course→module, module→lesson). */
    @Field(() => [MindMapEdge],
        {
            description: "Graph edges." 
        })
        edges: Array<MindMapEdge>
}

/**
 * GraphQL envelope for the course mind-map query.
 */
@ObjectType({
    description: "Response wrapper for the course mind-map query.",
})
export class CourseMindMapResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseMindMapResponseData>
{
    /** Computed graph payload. */
    @Field(() => CourseMindMapResponseData,
        {
            nullable: true,
            description: "Computed mind-map graph (nodes + edges).",
        })
        data: CourseMindMapResponseData
}
