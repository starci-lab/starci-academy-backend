import {
    posix,
} from "node:path"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import type {
    LocalizedText,
} from "@modules/databases/postgresql/primary/entities/advertisement.entity"
import {
    BlogPostEntity,
} from "@modules/databases/postgresql/primary/entities/blog-post.entity"
import {
    BlogCategory,
} from "@modules/databases/postgresql/primary/enums/blog-category"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    SeedScopeService,
} from "../../scope/seed-scope.service"
import {
    ContextLoaderService,
} from "../shared/contexts/loader.service"
import {
    CoerceMdScalarService,
} from "../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "../shared/extracts/extract-json-from-md.service"
import {
    PathResolverService,
} from "../shared/path/resolver.service"
import type {
    BlogPostLangFields,
} from "./types/blog-seed"

/** Mount data domain prefix -- posts live under `<contextRoot>/blog/`. */
const BLOG_BASE_DIR = "blog"

@Injectable()
/**
 * Seeds blog posts from `blog/<index>-<slug>/{en,vi}.md` (git-sourced data root
 * during init, else the local `.mount/data` fallback) -- the same folder-per-item
 * convention as course content, not a single combined file. Each language file
 * carries the full field set in the mount markdown grammar; per-language leaves
 * (`title` / `excerpt` / `body` / `ctaLabel`) are paired into bilingual jsonb,
 * while scalar metadata is read from whichever file has it. The folder name is
 * the stable `slug` (its `{index}-` prefix stripped). Idempotent on `slug`.
 */
export class BlogSeederService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly seedScopeService: SeedScopeService,
        private readonly pathResolverService: PathResolverService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
    ) {}

    /**
     * Discover every post folder under `blog/` and upsert each one by slug.
     */
    async seed(): Promise<void> {
        // env gate (seed.yaml `seeders.blog`)
        if (!this.seedScopeService.isBlogSeederEnabled()) {
            return
        }
        // list the `{index}-{slug}` post folders under the blog data root
        const paths = await this.pathResolverService.filePaths(BLOG_BASE_DIR,
            "")
        for (const path of paths) {
            // parse + upsert one post; a malformed/empty folder is skipped
            await this.seedOne(path.relativePath,
                path.displayId)
        }
    }

    /**
     * Parse one post folder's `en.md` + `vi.md` and upsert the row.
     *
     * @param relativePath - Folder path under `blog/` (e.g. `0-my-post`).
     * @param slug - The folder name with its `{index}-` prefix stripped.
     */
    private async seedOne(relativePath: string, slug: string): Promise<void> {
        // load each language file independently; either one may be absent
        const en = await this.loadLang(relativePath,
            "en.md")
        const vi = await this.loadLang(relativePath,
            "vi.md")
        // a folder with no readable language file is not a post -> skip
        if (!en && !vi) {
            return
        }
        // scalar metadata is language-agnostic -- prefer the EN file, fall back to VI
        const meta: BlogPostLangFields = en ?? vi ?? {
        }
        // pair the per-language leaves into bilingual jsonb (required fields fall
        // back to the other locale so a single-language post still persists)
        const title = this.pair(en?.title,
            vi?.title)
        const body = this.pair(en?.body,
            vi?.body)
        // a post with neither a title nor a body in any language is unusable
        if (!title || !body) {
            return
        }
        // optional bilingual leaves stay null when absent in both languages
        const excerpt = this.pairNullable(en?.excerpt,
            vi?.excerpt)
        const ctaLabel = this.pairNullable(en?.ctaLabel,
            vi?.ctaLabel)
        // upsert by the stable slug so re-seeding never duplicates
        await this.entityManager.upsert(
            BlogPostEntity,
            {
                slug,
                title,
                excerpt,
                body,
                category: this.coerceMdScalarService.toNullableEnum(
                    meta.category,
                    BlogCategory,
                ) ?? BlogCategory.DeepDive,
                coverImageUrl: this.coerceMdScalarService.toNullableStringColumn(
                    meta.coverImageUrl,
                ),
                readingMinutes: this.coerceMdScalarService.toNullableNumericColumn(
                    meta.readingMinutes,
                ),
                ctaUrl: this.coerceMdScalarService.toNullableStringColumn(
                    meta.ctaUrl,
                ),
                ctaLabel,
                sourceUrl: this.coerceMdScalarService.toNullableStringColumn(
                    meta.sourceUrl,
                ),
                isPremium: this.coerceMdScalarService.toRequiredBoolean(
                    meta.isPremium,
                    false,
                ),
                publishedAt: this.coerceMdScalarService.toNullableDate(
                    meta.publishedAt,
                ) ?? new Date(),
                isPublished: this.coerceMdScalarService.toRequiredBoolean(
                    meta.isPublished,
                    true,
                ),
            },
            ["slug"],
        )
    }

    /**
     * Load and parse one language file, returning its fields or null when the
     * file is missing (the context loader throws on a missing path).
     *
     * @param relativePath - Post folder path under `blog/`.
     * @param fileName - `en.md` or `vi.md`.
     * @returns Parsed fields, or null when the file is absent.
     */
    private async loadLang(
        relativePath: string,
        fileName: string,
    ): Promise<BlogPostLangFields | null> {
        // join with posix so the mount/S3 key uses forward slashes on every OS
        const filePath = posix.join(relativePath,
            fileName)
        try {
            // pull the raw markdown through the context fallback chain
            const content = await this.contextLoaderService.load(BLOG_BASE_DIR,
                filePath)
            // an empty file yields no usable fields
            if (!content) {
                return null
            }
            // top-level `# field` headings parse into a flat object of leaves
            return this.extractJsonFromMdService.extract<BlogPostLangFields>(content)
        } catch {
            // missing file (ContextFileNotFoundException) -> this locale is absent
            return null
        }
    }

    /**
     * Pair two locale values into a required bilingual object, filling a missing
     * side from the other so a single-language post still resolves in both
     * locales. Returns null only when both sides are empty.
     *
     * @param en - English value, if present.
     * @param vi - Vietnamese value, if present.
     * @returns The bilingual pair, or null when neither locale has a value.
     */
    private pair(
        en: string | undefined,
        vi: string | undefined,
    ): LocalizedText | null {
        // normalise empty strings to undefined so a blank section is "absent"
        const enValue = en?.trim() || undefined
        const viValue = vi?.trim() || undefined
        // nothing authored in either language -> no value
        if (!enValue && !viValue) {
            return null
        }
        // fall back across locales so neither side is ever an empty string
        return {
            en: enValue ?? viValue ?? "",
            vi: viValue ?? enValue ?? "",
        }
    }

    /**
     * Same as {@link BlogSeederService.pair} but for optional fields -- kept
     * separate only for call-site readability (both return null when empty).
     *
     * @param en - English value, if present.
     * @param vi - Vietnamese value, if present.
     * @returns The bilingual pair, or null when neither locale has a value.
     */
    private pairNullable(
        en: string | undefined,
        vi: string | undefined,
    ): LocalizedText | null {
        return this.pair(en,
            vi)
    }
}
