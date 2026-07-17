import {
    Injectable,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ContentEntity,
    CourseEntity,
    FlashcardDeckEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MindMapNodeEntityType,
    ModuleEntity,
} from "@modules/databases"
import type {
    CourseMindMapLink,
    CourseMindMapNode,
    CourseMindMapTree,
    Locale as LocaleType,
} from "@modules/databases"
import {
    CourseNotFoundException,
} from "@modules/exceptions"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
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

/** Horizontal gap between graph columns (course → module → lesson). */
const COLUMN_X = 340

/** Vertical gap between stacked lesson rows. */
const ROW_Y = 90

/**
 * Builds the course mind-map graph on the fly from the course → module → lesson hierarchy and
 * returns it in `@xyflow/react` node/edge shape (positions included). No persisted node tree.
 */
@Injectable()
export class CourseMindMapService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) {}

    /**
     * Returns the course mind-map graph, served from Redis when warm. The graph is purely
     * structural (titles + order) so it changes only on re-seed → a long TTL keeps reads fast.
     *
     * @param params - {@link BuildCourseMindMapParams}
     * @returns Nodes + edges ready to feed React Flow.
     */
    async execute(
        params: BuildCourseMindMapParams,
    ): Promise<CourseMindMapResponseData> {
        const {
            courseId,
        } = params
        // serve the cached graph when present — keyed by the raw arg (FE always passes the slug)
        const cached = await this.cacheService.get({
            key: CacheKey.CourseMindMap,
            args: [courseId],
        })
        if (cached) {
            return cached
        }
        // cold cache → build from the DB, then warm Redis for subsequent reads
        const graph = await this.buildGraph(params)
        await this.cacheService.set({
            key: CacheKey.CourseMindMap,
            args: [courseId],
            cacheResult: graph,
        })
        return graph
    }

    /**
     * Resolves the course (by id or slug), loads its modules + lessons, and assembles a tidy
     * left-to-right tree as `@xyflow/react` nodes + edges. DB-backed; callers go through
     * {@link execute} for the cached path.
     *
     * @param params - {@link BuildCourseMindMapParams}
     * @returns Freshly computed nodes + edges.
     */
    private async buildGraph(
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
                        id: courseId 
                    },
                    {
                        displayId: courseId 
                    }]
                    : {
                        displayId: courseId 
                    },
            },
        )
        // surface a typed 404 so the resolver/transform layer can map it to a clean error envelope
        if (!course) {
            throw new CourseNotFoundException(
                isUuid ? {
                    id: courseId 
                } : {
                    displayId: courseId 
                },
            )
        }

        // an AUTHORED concept map wins: it is the real "sơ đồ tư duy" (keywords + cross-links).
        // Courses without one (or the public/guest map) fall back to the derived module graph below.
        if (course.mindMap) {
            return this.buildConceptGraph(course, course.mindMap, locale)
        }

        // load this course's modules in display order — they become the middle column
        const modules = await this.entityManager.find(
            ModuleEntity,
            {
                where: {
                    course: {
                        id: course.id,
                    },
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )

        // pull every lesson for those modules in ONE query (avoid N+1), still in display order
        const moduleIds = modules.map((module) => module.id)
        const contents = moduleIds.length > 0
            ? await this.entityManager.find(
                ContentEntity,
                {
                    where: {
                        module: {
                            id: In(moduleIds),
                        },
                    },
                    order: {
                        sortIndex: "ASC",
                    },
                },
            )
            : []

        // bucket lessons under their owning module id for the layout pass
        const contentsByModule = new Map<string, Array<ContentEntity>>()
        for (const content of contents) {
            const bucket = contentsByModule.get(content.moduleId) ?? []
            bucket.push(content)
            contentsByModule.set(content.moduleId,
                bucket)
        }

        const nodes: Array<MindMapNode> = []
        const edges: Array<MindMapEdge> = []
        // running row index across ALL lessons so columns never overlap vertically
        let rowCursor = 0
        // collect module y-positions to center the course root against them afterwards
        const moduleYs: Array<number> = []
        const courseNodeId = `course-${course.id}`

        for (const module of modules) {
            // lessons owned by this module (already display-ordered)
            const moduleContents = contentsByModule.get(module.id) ?? []
            const firstRow = rowCursor
            const moduleNodeId = `module-${module.id}`

            // place each lesson stacked in the right-most column
            for (const content of moduleContents) {
                const lessonNodeId = `lesson-${content.id}`
                nodes.push({
                    id: lessonNodeId,
                    type: "lesson",
                    position: {
                        x: COLUMN_X * 2,
                        y: rowCursor * ROW_Y,
                    },
                    data: {
                        label: content.title,
                        kind: MindMapNodeEntityType.Lesson,
                        entityId: content.id,
                        // lesson URL needs its module id → carry it on the node
                        moduleId: module.id,
                        displayId: content.displayId,
                        // derived graph nodes point at ONE entity (via entityId) — no cross-links
                        links: [],
                        desc: null,
                    },
                })
                // connect the module to this lesson
                edges.push({
                    id: `${moduleNodeId}--${lessonNodeId}`,
                    source: moduleNodeId,
                    target: lessonNodeId,
                    type: null,
                    animated: null,
                })
                rowCursor++
            }

            // center the module against its lessons; modules with no lessons take their own row
            const moduleY = moduleContents.length > 0
                ? ((firstRow + rowCursor - 1) / 2) * ROW_Y
                : (rowCursor++) * ROW_Y
            moduleYs.push(moduleY)

            // place the module node in the middle column and link it to the course root
            nodes.push({
                id: moduleNodeId,
                type: "module",
                position: {
                    x: COLUMN_X,
                    y: moduleY,
                },
                data: {
                    label: module.title,
                    kind: MindMapNodeEntityType.Module,
                    entityId: module.id,
                    moduleId: null,
                    displayId: module.displayId,
                    links: [],
                    desc: null,
                },
            })
            edges.push({
                id: `${courseNodeId}--${moduleNodeId}`,
                source: courseNodeId,
                target: moduleNodeId,
                type: null,
                animated: null,
            })
        }

        // center the course root vertically against the module column
        const courseY = moduleYs.length > 0
            ? moduleYs.reduce((acc, y) => acc + y,
                0) / moduleYs.length
            : 0
        // prepend the root so consumers see it first (order is otherwise irrelevant to React Flow)
        nodes.unshift({
            id: courseNodeId,
            type: "course",
            position: {
                x: 0,
                y: courseY,
            },
            data: {
                label: course.title,
                kind: MindMapNodeEntityType.Course,
                entityId: course.id,
                moduleId: null,
                displayId: course.displayId,
                links: [],
                desc: null,
            },
        })

        return {
            nodes,
            edges,
        }
    }

    /**
     * Builds the AUTHORED concept mind-map: the course's `mind_map` jsonb keyword tree laid out as
     * a tidy left-to-right tree (depth → column, leaves stacked, parents centered against their
     * children). Concept nodes carry `kind = custom` and a LIST of cross-links to the surfaces that
     * teach/drill/test them — resolved from authored mount slugs to routable ids here so the client
     * only builds URLs.
     *
     * Only `lesson`/`challenge` links need id resolution (their route is module+content scoped);
     * `milestone`/`interview` open their section page, so they carry the slug and a null id.
     *
     * @param course - The resolved course row (its `mindMap` is non-null).
     * @param tree - The authored concept tree.
     * @param locale - Active request locale, picks the bilingual label.
     * @returns Nodes + edges in `@xyflow/react` shape.
     */
    private async buildConceptGraph(
        course: CourseEntity,
        tree: CourseMindMapTree,
        locale: LocaleType,
    ): Promise<CourseMindMapResponseData> {
        // ---- resolve authored slugs → routable ids (batched; no N+1) ----
        const modules = await this.entityManager.find(ModuleEntity,
            {
                where: {
                    course: {
                        id: course.id
                    },
                },
            })
        const moduleBySlug = new Map(modules.map((module) => [module.displayId, module]))
        const contents = modules.length > 0
            ? await this.entityManager.find(ContentEntity,
                {
                    where: {
                        module: {
                            id: In(modules.map((module) => module.id)),
                        },
                    },
                })
            : []
        // lesson slugs repeat across modules → key by owning module + slug
        const contentByModuleAndSlug = new Map(
            contents.map((content) => [`${content.moduleId}:${content.displayId}`, content]),
        )
        const decks = await this.entityManager.find(FlashcardDeckEntity,
            {
                where: {
                    course: {
                        id: course.id
                    },
                },
            })
        const deckBySlug = new Map(decks.map((deck) => [deck.displayId, deck]))

        /** Resolve one authored link into the ids the client needs to build its href. */
        const resolveLink = (link: CourseMindMapLink) => {
            if (link.kind === "lesson" || link.kind === "challenge") {
                const owningModule = link.module ? moduleBySlug.get(link.module) : undefined
                const content = owningModule
                    ? contentByModuleAndSlug.get(`${owningModule.id}:${link.ref}`)
                    : undefined
                return {
                    kind: link.kind === "lesson"
                        ? MindMapNodeEntityType.Lesson
                        : MindMapNodeEntityType.Challenge,
                    entityId: content?.id ?? null,
                    moduleId: owningModule?.id ?? null,
                    displayId: link.ref,
                }
            }
            if (link.kind === "flashcard") {
                return {
                    kind: MindMapNodeEntityType.Flashcard,
                    entityId: deckBySlug.get(link.ref)?.id ?? null,
                    moduleId: null,
                    displayId: link.ref,
                }
            }
            // milestone / interview open their section page — the slug is enough, no id lookup
            return {
                kind: link.kind === "milestone"
                    ? MindMapNodeEntityType.Milestone
                    : MindMapNodeEntityType.Interview,
                entityId: null,
                moduleId: null,
                displayId: link.ref,
            }
        }

        /** Pick the bilingual label for the active locale (falls back to the other side). */
        const text = (value: { en: string; vi: string }) =>
            (locale === "vi" ? (value.vi || value.en) : (value.en || value.vi))

        // ---- lay out the tree: depth → column, leaves stacked, parents centered ----
        const nodes: Array<MindMapNode> = []
        const edges: Array<MindMapEdge> = []
        let rowCursor = 0
        const rootNodeId = `course-${course.id}`

        /**
         * Emit one concept subtree and return its vertical centre, so the caller can centre
         * itself against its children (recursive post-order layout).
         */
        const walk = (node: CourseMindMapNode, depth: number, parentId: string): number => {
            const nodeId = `concept-${node.id}`
            const children = node.children ?? []
            // leaves take the next free row; parents centre between their first/last child
            let y: number
            if (children.length === 0) {
                y = rowCursor * ROW_Y
                rowCursor += 1
            } else {
                const childYs = children.map((child) => walk(child, depth + 1, nodeId))
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
                    // an authored keyword is not an entity — it POINTS at them via `links`
                    kind: MindMapNodeEntityType.Custom,
                    entityId: null,
                    moduleId: null,
                    displayId: node.id,
                    links: (node.links ?? []).map(resolveLink),
                    desc: node.desc ? text(node.desc) : null,
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

        const branchYs = (tree.children ?? []).map((branch) => walk(branch, 1, rootNodeId))
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
                label: text(tree.root),
                kind: MindMapNodeEntityType.Course,
                entityId: course.id,
                moduleId: null,
                displayId: course.displayId,
                links: [],
                desc: null,
            },
        })

        return {
            nodes,
            edges,
        }
    }
}
