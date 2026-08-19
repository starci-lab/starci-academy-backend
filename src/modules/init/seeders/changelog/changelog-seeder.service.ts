import {
    existsSync,
    readFileSync,
} from "node:fs"
import {
    join,
} from "node:path"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    ChangelogEntryEntity,
} from "@modules/databases/postgresql/primary/entities/changelog-entry.entity"
import {
    ChangelogCategory,
} from "@modules/databases/postgresql/primary/enums/changelog-category"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem/utils/mount-seed"
import {
    SeedScopeService,
} from "../../scope/seed-scope.service"
import {
    CoerceMdScalarService,
} from "../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "../shared/extracts/extract-json-from-md.service"
import type {
    ChangelogSeedFileRoot,
} from "./types"

@Injectable()
/**
 * Seeds system changelog entries from `changelog/changelog.md` (git-sourced data
 * root during init, else the local `.mount/data` fallback). The file uses the
 * mount markdown grammar (`# <n>` array items, `## field` object keys); nested
 * `title` / `body` become bilingual jsonb objects. Idempotent: each row is
 * upserted by its `slug`.
 */
export class ChangelogSeederService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
    ) {}

    /**
     * Parse the changelog markdown and upsert each entry by slug.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seed.changelog`)
        if (!this.seedScopeService.isChangelogSeederEnabled()) {
            return
        }
        // resolve the markdown path (git snapshot root first, else local mount)
        const file = this.resolveFile()
        if (!file) {
            return
        }
        // extract the array root (`# 0`, `# 1`, ... -> wrapped as `{ data: [...] }`)
        const parsed = this.extractJsonFromMdService.extract<ChangelogSeedFileRoot>(readFileSync(file,
            "utf8"))
        const items = parsed.data ?? []
        for (const item of items) {
            // upsert by the stable slug so re-seeding never duplicates; scalar
            // leaves arrive as strings, so the category / date / flag are coerced
            await this.entityManager.upsert(
                ChangelogEntryEntity,
                {
                    slug: this.coerceMdScalarService.toRequiredString(item.slug,
                        ""),
                    title: item.title,
                    body: item.body ?? null,
                    category: this.coerceMdScalarService.toNullableEnum(
                        item.category,
                        ChangelogCategory,
                    ) ?? null,
                    publishedAt: this.coerceMdScalarService.toNullableDate(
                        item.publishedAt,
                    ) ?? new Date(),
                    linkUrl: this.coerceMdScalarService.toNullableStringColumn(
                        item.linkUrl,
                    ),
                    isPublished: this.coerceMdScalarService.toRequiredBoolean(
                        item.isPublished,
                        true,
                    ),
                },
                ["slug"],
            )
        }
    }

    /**
     * First existing candidate path for the changelog markdown: the active git
     * snapshot root (during init), else the local mount-data fallback.
     *
     * @returns the markdown file path, or null when none exists.
     */
    private resolveFile(): string | null {
        const root = getRuntimeContextRoot()
        const candidates = [
            root ? join(root,
                "changelog",
                "changelog.md") : null,
            join(envConfig().mountPath.data.changelog,
                "changelog.md"),
        ].filter((path): path is string => Boolean(path))
        return candidates.find((path) => existsSync(path)) ?? null
    }
}
