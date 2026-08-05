import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MindMapNodeEntityType,
} from "@modules/databases"
import type {
    CourseMindMapNode,
    CourseMindMapTree,
    Locale as LocaleType,
} from "@modules/databases"
import {
    CourseNotFoundException,
} from "@modules/exceptions"
import {
    CourseMindMapResponseData,
    MindMapEdge,
    MindMapNode,
} from "./graphql-types"
import type {
    BuildCourseMindMapParams,
} from "./types"

/** Matches a canonical v4-style UUID so we know whether to look the course up by id or by slug. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

/** Horizontal gap between graph columns (each keyword-tree depth level). Tightened 2026-07-18 (thầy: "các node gần nhau tí"). */
const COLUMN_X = 268

/** Card chrome (top+bottom padding + border) added to the text height of a node. */
const NODE_CHROME_Y = 24
/** Height of ONE wrapped text line in a node card (`body-sm`). */
const NODE_LINE_Y = 20
/** Clear gap left BELOW each stacked leaf so neighbours never touch. */
const ROW_GAP_Y = 20
/**
 * Approx characters that fit on one line at the node's max width (~220px, `body-sm`). A label longer
 * than this wraps to a 2nd line (nodes are `line-clamp-2`), so its row must reserve more height —
 * the FIX for 2-line nodes overlapping the one below (thầy 2026-07-18). Deliberately a touch LOW so
 * we over-reserve rather than overlap.
 */
const CHARS_PER_LINE = 22

/** Estimated rendered height of a leaf node from its label length (1 vs 2 lines). */
const estimateLeafHeight = (label: string): number => {
    const lines = Math.min(2,
        Math.max(1,
            Math.ceil(label.length / CHARS_PER_LINE)))
    return NODE_CHROME_Y + lines * NODE_LINE_Y
}

@Injectable()
/**
 * Serves the course "sơ đồ tư duy": the authored `mind_map` jsonb keyword tree, laid out as a tidy
 * left-to-right tree in `@xyflow/react` node/edge shape.
 *
 * Reading it is a SINGLE indexed row fetch (`courses` by `display_id`/`id`) plus an in-memory jsonb
 * walk — no joins, no link resolution (keywords carry no hard links; the client finds related
 * content by RAG on the label). So it is served DIRECTLY from Postgres with NO Redis cache: a cache
 * would only add staleness (needing manual purges on re-seed) for an already-O(1) read — thầy
 * 2026-07-18: *"cache redis chi, query thẳng chứ O(1) mà"*.
 */
export class CourseMindMapService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Resolves the course (by id or slug) and returns its authored keyword tree as React Flow
     * nodes + edges. A course with NO authored map returns an EMPTY graph (the client shows an
     * authored-map-only empty state + funnel to "Học phần") rather than a derived module graph — a
     * mechanical course→module→lesson dump read as the broken "vertical strand" (thầy 2026-07-18).
     *
     * @param params - {@link BuildCourseMindMapParams}
     * @returns Nodes + edges ready to feed React Flow.
     */
    async execute(
        {
            courseId,
            locale,
        }: BuildCourseMindMapParams,
    ): Promise<CourseMindMapResponseData> {
        // the route passes a slug (`fullstack-mastery`) but callers may hold a UUID — branch on shape
        const isUuid = UUID_REGEX.test(courseId)
        // resolve by id OR slug; only include the id branch when the value is a valid UUID (a
        // non-uuid string compared against a uuid column throws at the Postgres layer)
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: isUuid
                    ? [{
                        id: courseId,
                    },
                    {
                        displayId: courseId,
                    }]
                    : {
                        displayId: courseId,
                    },
            },
        )
        // surface a typed 404 so the resolver/transform layer can map it to a clean error envelope
        if (!course) {
            throw new CourseNotFoundException(
                isUuid ? {
                    id: courseId,
                } : {
                    displayId: courseId,
                },
            )
        }
        // unauthored course → EMPTY (no derived module graph)
        if (!course.mindMap) {
            return {
                nodes: [],
                edges: [],
            }
        }
        return this.buildConceptGraph(course,
            course.mindMap,
            locale)
    }

    /**
     * Lays the authored keyword tree out as a tidy left-to-right tree: depth → column, each
     * subtree's leaves stacked in a contiguous band, every parent centred against its children.
     *
     * PURE + synchronous (in-memory) — the tree is keywords only, so there is no DB join / slug
     * resolution; each node carries an EMPTY `links` (the client resolves related surfaces by RAG
     * on the keyword) and the authored `desc` (the drawer explainer) picked for the locale.
     *
     * @param course - The resolved course row (its `mindMap` is non-null).
     * @param tree - The authored keyword tree.
     * @param locale - Active request locale, picks the bilingual label/desc.
     * @returns Nodes + edges in `@xyflow/react` shape.
     */
    private buildConceptGraph(
        course: CourseEntity,
        tree: CourseMindMapTree,
        locale: LocaleType,
    ): CourseMindMapResponseData {
        /** Pick the bilingual text for the active locale (falls back to the other side). */
        const text = (value: { en: string; vi: string }) =>
            (locale === "vi" ? (value.vi || value.en) : (value.en || value.vi))

        // ---- lay out the tree: depth → column, leaves stacked, parents centered ----
        const nodes: Array<MindMapNode> = []
        const edges: Array<MindMapEdge> = []
        // running VERTICAL position (px). Each leaf advances it by its OWN estimated height + a gap,
        // so a 2-line node reserves more room and never overlaps the node below (thầy 2026-07-18).
        let yCursor = 0
        const rootNodeId = `course-${course.id}`

        /**
         * Emit one keyword subtree and return its vertical centre, so the caller can centre itself
         * against its children (recursive post-order layout).
         */
        const walk = (node: CourseMindMapNode, depth: number, parentId: string): number => {
            const nodeId = `concept-${node.id}`
            const children = node.children ?? []
            // leaves take a slot sized to their OWN height (1 vs 2 lines); parents centre between
            // their first/last child.
            let y: number
            if (children.length === 0) {
                const height = estimateLeafHeight(text(node.label))
                y = yCursor + height / 2
                yCursor += height + ROW_GAP_Y
            } else {
                const childYs = children.map((child) => walk(child,
                    depth + 1,
                    nodeId))
                y = (childYs[0] + childYs[childYs.length - 1]) / 2
            }
            nodes.push({
                id: nodeId,
                type: "concept",
                position: {
                    x: COLUMN_X * depth,
                    y,
                },
                data: {
                    label: text(node.label),
                    // an authored keyword is not an entity; related surfaces come from RAG on the label
                    kind: MindMapNodeEntityType.Custom,
                    entityId: null,
                    moduleId: null,
                    displayId: node.id,
                    links: [],
                    desc: node.desc ? text(node.desc) : null,
                    popularity: node.popularity ?? null,
                },
            })
            edges.push({
                id: `${parentId}--${nodeId}`,
                source: parentId,
                target: nodeId,
                type: null,
                animated: null,
            })
            return y
        }

        const branchYs = (tree.children ?? []).map((branch) => walk(branch,
            1,
            rootNodeId))
        // root sits in column 0, centred against its branches
        nodes.unshift({
            id: rootNodeId,
            type: "course",
            position: {
                x: 0,
                y: branchYs.length > 0
                    ? (branchYs[0] + branchYs[branchYs.length - 1]) / 2
                    : 0,
            },
            data: {
                // root shows the real COURSE TITLE (not the authored persona label) — thầy 2026-07-18.
                label: course.title,
                kind: MindMapNodeEntityType.Course,
                entityId: course.id,
                moduleId: null,
                displayId: course.displayId,
                links: [],
                desc: null,
                popularity: null,
            },
        })

        return {
            nodes,
            edges,
        }
    }
}
