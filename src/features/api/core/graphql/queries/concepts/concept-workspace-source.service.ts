import {
    Injectable,
} from "@nestjs/common"
import {
    readFile,
    realpath,
    stat,
} from "node:fs/promises"
import {
    isAbsolute,
    relative,
    resolve,
} from "node:path"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    ContextType,
} from "@modules/platform/env/enums/context"
import {
    DATA_GIT_MANIFEST_FILE,
} from "@modules/init/data-git/constants"
import type {
    SnapshotManifest,
} from "@modules/init/data-git/types/data-git"
import type {
    ConceptEntity,
} from "@modules/databases/postgresql/primary/entities/concept.entity"
import type {
    ConceptWorkspaceFile,
} from "@modules/init/seeders/concepts/types"

/** Largest source file returned by the reader. */
const MAX_SOURCE_BYTES = 512 * 1024

@Injectable()
/** Reads learner-safe source files from the newest successfully seeded snapshot. */
export class ConceptWorkspaceSourceService {
    /** Return UTF-8 source content, or null when the snapshot/file is unavailable. */
    async read(
        concept: Pick<ConceptEntity, "displayId" | "orderIndex">,
        file: ConceptWorkspaceFile,
    ): Promise<string | null> {
        if (!this.safeSourceFile(file)) {
            return null
        }
        try {
            const datasourcesRoot = this.datasourcesRoot()
            if (!datasourcesRoot) {
                return null
            }
            const snapshotRoot = await this.latestSnapshotRoot(datasourcesRoot)
            if (!snapshotRoot) {
                return null
            }
            const conceptRoot = await realpath(resolve(
                snapshotRoot,
                "concepts",
                `${concept.orderIndex}-${concept.displayId}`,
            ))
            const candidate = await realpath(resolve(
                conceptRoot,
                ...file.path.split("/"),
            ))
            if (!this.isChild(conceptRoot,
                candidate)) {
                return null
            }
            const fileStat = await stat(candidate)
            if (!fileStat.isFile() || fileStat.size > MAX_SOURCE_BYTES) {
                return null
            }
            const content = await readFile(candidate)
            if (content.length > MAX_SOURCE_BYTES || content.includes(0)) {
                return null
            }
            return new TextDecoder("utf-8",
                {
                    fatal: true,
                }).decode(content)
        } catch {
            return null
        }
    }

    private datasourcesRoot(): string | null {
        const context = envConfig().contexts.find((item) => item.enabled
            && item.type === ContextType.Filesystem)
        return context?.path ?? null
    }

    private async latestSnapshotRoot(datasourcesRoot: string): Promise<string | null> {
        const raw = await readFile(resolve(datasourcesRoot,
            DATA_GIT_MANIFEST_FILE),
        "utf8")
        const manifest = JSON.parse(raw) as Partial<SnapshotManifest>
        const sha = manifest.snapshots?.at(-1)?.sha
        if (!sha || !/^[a-f0-9]{40}$/u.test(sha)) {
            return null
        }
        const root = await realpath(datasourcesRoot)
        const snapshot = await realpath(resolve(root,
            sha))
        return this.isChild(root,
            snapshot) ? snapshot : null
    }

    private safeSourceFile(file: ConceptWorkspaceFile): boolean {
        const segments = file.path.split("/")
        return ["source",
            "support",
            "test"].includes(file.role)
            && !isAbsolute(file.path)
            && !file.path.includes("\\")
            && segments.length >= 2
            && segments[0] === "workspace"
            && segments.every((segment) => segment !== ""
                && segment !== "."
                && segment !== ".."
                && /^[a-zA-Z0-9._-]+$/u.test(segment))
    }

    private isChild(parent: string, child: string): boolean {
        const path = relative(parent,
            child)
        return path.length > 0
            && !path.startsWith("..")
            && !isAbsolute(path)
    }
}
