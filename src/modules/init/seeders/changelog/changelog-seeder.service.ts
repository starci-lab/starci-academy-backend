import {
    existsSync,
    readFileSync,
} from "fs"
import {
    join,
} from "path"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    load,
} from "js-yaml"
import {
    ChangelogEntryEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem"
import {
    SeedScopeService,
} from "../../scope"
import type {
    ChangelogSeedItem,
} from "./types"

/**
 * Seeds system changelog entries from `changelog/changelog.yaml` (git-sourced
 * data root during init, else the local `.mount/data` fallback). Idempotent:
 * each row is upserted by its `slug`.
 */
@Injectable()
export class ChangelogSeederService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
    ) {}

    /**
     * Parse the changelog YAML and upsert each entry by slug.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seed.changelog`)
        if (!this.seedScopeService.isChangelogSeederEnabled()) {
            return
        }
        // resolve the YAML path (git snapshot root first, else local mount)
        const file = this.resolveFile()
        if (!file) {
            return
        }
        // parse the list (empty/missing file → nothing to seed)
        const items = (load(readFileSync(file,
            "utf8")) ?? []) as Array<ChangelogSeedItem>
        for (const item of items) {
            // upsert by the stable slug so re-seeding never duplicates
            await this.entityManager.upsert(
                ChangelogEntryEntity,
                {
                    slug: item.slug,
                    title: item.title,
                    body: item.body ?? null,
                    category: item.category ?? null,
                    publishedAt: new Date(item.publishedAt),
                    linkUrl: item.linkUrl ?? null,
                    isPublished: item.isPublished ?? true,
                },
                ["slug"],
            )
        }
    }

    /**
     * First existing candidate path for the changelog YAML: the active git
     * snapshot root (during init), else the local mount-data fallback.
     *
     * @returns the YAML file path, or null when none exists.
     */
    private resolveFile(): string | null {
        const root = getRuntimeContextRoot()
        const candidates = [
            root ? join(root,
                "changelog",
                "changelog.yaml") : null,
            join(envConfig().mountPath.data.changelog,
                "changelog.yaml"),
        ].filter((path): path is string => Boolean(path))
        return candidates.find((path) => existsSync(path)) ?? null
    }
}
