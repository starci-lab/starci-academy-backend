import type {
    MindMapNodeYaml,
    MindMapNodesFromDatabaseParams,
    ParseMindMapParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    load as yamlLoad,
} from "js-yaml"
import {
    ContextLoaderService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    ContextFileNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"
import {
    EntityManager,
} from "typeorm"
import {
    CourseIdFactoryService,
} from "../id-factories"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MindMapNodeEntity,
} from "@modules/databases"

/**
 * File name of the mind-map source inside each course's mount folder.
 */
const MIND_MAP_FILE_NAME = "mind-map.yaml"

/**
 * Parses the optional `mind-map.yaml` colocated next to each course's `en.md` / `vi.md`.
 *
 * The YAML is a free-form tree (`label`, optional `color`, optional `module` displayId
 * for entity-ref linking, and nested `children`). Missing file is **not** an error — the
 * parser returns `null` so the seeder can skip the insert step. Malformed YAML is logged
 * as a skipped-entity warning and also returns `null` to avoid breaking the whole seed.
 *
 * Structural concerns (FK course id, module displayId → uuid resolution, closure rows)
 * live in {@link import("../upsert").MindMapUpsertService}.
 */
@Injectable()
export class MindMapParserService {
    constructor(
        private readonly contextLoaderService: ContextLoaderService,
        private readonly winstonService: WinstonService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Reads `mind-map.yaml` from the course mount folder and returns the decoded tree.
     *
     * @param params - Mount-relative path of the course directory.
     * @returns The parsed root node, or `null` when the file is missing or malformed.
     */
    async parse(
        {
            courseRelativePath,
        }: ParseMindMapParams,
    ): Promise<MindMapNodeYaml | null> {
        const fileRelativePath = `${courseRelativePath}/${MIND_MAP_FILE_NAME}`

        // load YAML; missing file → return null (mind-map is optional per course)
        let raw: string
        try {
            raw = await this.contextLoaderService.load(
                "courses",
                fileRelativePath,
            )
        } catch (error) {
            if (error instanceof ContextFileNotFoundException) {
                return null
            }
            throw error
        }

        // decode + minimal shape guard (insert layer handles module ref + tree walk)
        const root = yamlLoad(raw) as unknown
        if (!isMindMapNode(root)) {
            logInitSeederEntitySkipped(
                this.winstonService,
                MindMapNodeEntity,
                fileRelativePath,
                new Error("invalid mind-map shape (expected { label, children? } at root)"),
            )
            return null
        }
        return root
    }

    /**
     * Loads persisted mind-map nodes for one course (DB inspection / sync checks).
     *
     * @param params - Course ordinal on the mount.
     * @returns Mind-map node rows keyed by deterministic `courseId`.
     */
    async mindMapNodesFromDatabase(
        params: MindMapNodesFromDatabaseParams,
    ): Promise<Array<MindMapNodeEntity>> {
        const {
            courseIndex,
        } = params
        const courseId = this.courseIdFactoryService.generate({
            courseIndex,
        })
        return this.entityManager.find(MindMapNodeEntity, {
            where: {
                courseId,
            },
        })
    }
}

/**
 * Runtime structural guard: a mind-map node must be an object with a string `label`.
 */
function isMindMapNode(value: unknown): value is MindMapNodeYaml {
    return (
        typeof value === "object"
        && value !== null
        && typeof (value as { label?: unknown }).label === "string"
    )
}
