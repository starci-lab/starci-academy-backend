import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MindMapNodeEntity,
    MindMapNodeEntityType,
    ModuleEntity,
    Locale,
} from "@modules/databases"
import {
    WinstonLog,
    WinstonService,
    DbSyncType,
} from "@modules/winston"
import type {
    InsertMindMapNodeParams,
    InsertMindMapParams,
} from "./types"

/**
 * Inserts the full mind-map tree for a single course.
 *
 * Strategy: **wipe-and-recreate per course**.
 * Mind-map node IDs are non-deterministic (TypeORM-generated UUIDs) — the tree is a
 * single semantic unit so we delete every node of the course (closure rows cascade
 * via FK `ON DELETE CASCADE`) and re-insert from the YAML. This guarantees the
 * closure table stays consistent even when the tree topology changes between runs.
 *
 * Nodes whose YAML carries `module: <displayId>` are linked to the real module via
 * the polymorphic `entityRef` (`entityType = Module`, `entityId = <module uuid>`).
 * Unknown displayIds degrade gracefully to decorative nodes (logged as warning).
 */
@Injectable()
export class MindMapInsertService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Replace the mind-map of a course with the given YAML tree.
     *
     * @param params - The owning course id and the parsed YAML root.
     */
    async insert(
        {
            courseId,
            root,
        }: InsertMindMapParams,
    ): Promise<void> {
        // resolve module displayId → uuid for entityRef linking
        const moduleByDisplayId = await this.loadModuleLookup(courseId)

        // wipe previous mindmap of this course (closure rows cascade via FK)
        await this.entityManager.delete(
            MindMapNodeEntity,
            {
                course: {
                    id: courseId,
                },
            },
        )

        // recursive insert via TreeRepository (closure rows maintained automatically)
        const nodeRepo = this.entityManager.getTreeRepository(MindMapNodeEntity)
        await this.insertNode(
            {
                node: root,
                parent: null,
                orderIndex: 0,
                courseId,
                moduleByDisplayId,
                nodeRepo,
            },
        )
    }

    /**
     * Loads module displayId → uuid for a course.
     * Uses a raw query because `ModuleEntity.courseId` is a `@RelationId`
     * projection, not a real column, so it cannot be used in `FindOptions.where`.
     */
    private async loadModuleLookup(
        courseId: string,
    ): Promise<Map<string, string>> {
        const rows = await this.entityManager.query(
            "SELECT id, display_id FROM modules WHERE course_id = $1",
            [courseId],
        ) as Array<{ id: string, display_id: string }>
        return new Map(
            rows.map((row) => [
                row.display_id,
                row.id,
            ]),
        )
    }

    /**
     * Recursively inserts a YAML node and all its descendants.
     * Returns the persisted entity so the parent reference is preserved for closure rows.
     */
    private async insertNode(
        {
            node,
            parent,
            orderIndex,
            courseId,
            moduleByDisplayId,
            nodeRepo,
        }: InsertMindMapNodeParams,
    ): Promise<MindMapNodeEntity> {
        // resolve optional entityRef (module link)
        let entityType: MindMapNodeEntityType | null = null
        let entityId: string | null = null
        if (node.module) {
            const moduleId = moduleByDisplayId.get(node.module)
            if (moduleId) {
                entityType = MindMapNodeEntityType.Module
                entityId = moduleId
            } else {
                this.winstonService.log(
                    WinstonLog.InitSeederEntitySkipped,
                    {
                        entityType: MindMapNodeEntity.name,
                        relativePath: `mind-map:module=${node.module}`,
                        errorCode: undefined,
                        errorMessage:
                            `unknown ModuleEntity.displayId="${node.module}" → node "${node.label}" stays decorative`,
                    },
                )
            }
        }

        // create + save the node (closure rows handled by TreeRepository)
        const draft = nodeRepo.create({
            label: node.label,
            color: node.color ?? null,
            orderIndex,
            defaultLocale: Locale.Vi,
            entityType,
            entityId,
            course: {
                id: courseId,
            } as ModuleEntity["course"],
            parent,
        })
        const saved = await nodeRepo.save(draft)

        this.winstonService.log(
            WinstonLog.DbSynchronizerSyncedSuccessfully,
            {
                entityKind: MindMapNodeEntity.name,
                entityId: saved.id,
                type: DbSyncType.Added,
            },
        )

        // recurse into children in YAML order
        const children = node.children ?? []
        for (let index = 0; index < children.length; index++) {
            await this.insertNode(
                {
                    node: children[index],
                    parent: saved,
                    orderIndex: index,
                    courseId,
                    moduleByDisplayId,
                    nodeRepo,
                },
            )
        }
        return saved
    }
}
