import type {
    ParseContentParams,
    ParseContentManyParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    ContentEntity,
} from "@modules/databases"
import {
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    ContextLoaderService,
    ResolvedFileResult,
    MergeJsonService,
    MergeJsonResult,
} from "../../shared"
import {
    ContentPathNotFoundException,
} from "@modules/exceptions"
import {
    ContentPathService,
} from "../path"

@Injectable()
/**
 * Legacy (V1) content parser for mounted course files (`en.md`, `vi.md`).
 *
 * Parses the **old** lesson markdown shape (documented in
 * `.claude/pattern/17-legacy-content-challenge-format.md`, live examples = M0 L1/L2): `# title`,
 * `# description`, `# body` (full Markdown prose inline, per-locale), `# minutesRead`,
 * `# isPremium`. The body is a single inline blob -- NOT the V2 `bodies/<N>-<lang>/` per-language folder.
 *
 * Follows the canonical mount-parse pattern (`.claude/pattern/16-mount-parsing.md`): extract once per
 * locale, merge via {@link MergeJsonService} with dot-path `translateFields`, then render straight
 * from `merged`.
 *
 * Paired with {@link ContentParserService}: invoked from {@link ContentParserService.parseMany}
 * when {@link ContentParserService.isV2} is false.
 */
export class ContentLegacyParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly contentPathService: ContentPathService,
    ) { }

    /**
     * Builds a partial legacy content entity from mounted course files.
     *
     * @param params - Content path list + course/module/content ordinals.
     * @returns Entity-shaped graph for TypeORM cascade save.
     */
    async parse(
        {
            paths,
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseContentParams,
    ): Promise<DeepPartial<ContentEntity>> {
        const path = paths.find(
            (candidate) => candidate.orderIndex === contentIndex,
        )
        if (!path) {
            throw new ContentPathNotFoundException(
                {
                    contentIndex,
                },
            )
        }
        // extract the heading structure for every locale's markdown file
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        "courses",
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        // merge locales into one default-locale doc + aligned translation rows per i18n field
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: jsonMap.get(locale) ?? {
                },
            })),
            translateFields: [
                "title",
                "description",
                "body",
            ],
        }) as MergeJsonResult<DeepPartial<ContentEntity>>
        const contentId = this.contentIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
            },
        )
        return {
            id: contentId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            title: this.coerceMdScalarService.toRequiredString(
                merged.title,
                "",
            ),
            description: this.coerceMdScalarService.toNullableStringColumn(
                merged.description,
            ),
            body: this.coerceMdScalarService.toRequiredString(
                merged.body,
                "",
            ),
            orderIndex: contentIndex,
            // pure display-ordering index -- explicit `# sortIndex`, else falls back to orderIndex
            sortIndex: this.toSortIndex(
                (merged as { sortIndex?: unknown }).sortIndex,
                contentIndex,
            ),
            minutesRead: this.coerceMdScalarService.toRequiredNumber(
                merged.minutesRead,
                0,
            ),
            isPremium: this.coerceMdScalarService.toRequiredBoolean(
                merged.isPremium,
                false,
            ),
            isSandbox: this.coerceMdScalarService.toRequiredBoolean(
                merged.isSandbox,
                false,
            ),
            githubBaseUrl: this.coerceMdScalarService.toNullableStringColumn(
                merged.githubBaseUrl,
            ),
            githubDir: this.coerceMdScalarService.toNullableStringColumn(
                merged.githubDir,
            ),
            backendUrl: this.coerceMdScalarService.toNullableStringColumn(
                merged.backendUrl,
            ),
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    contentId,
                    locale,
                    field,
                    value,
                }),
            ),
        }
    }

    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to the
     * given `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }

    /**
     * Parses many legacy contents from the mount.
     *
     * @param moduleRelativePath - Module relative path
     * @param courseIndex - Course index
     * @param moduleIndex - Module index
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
        {
            moduleRelativePath,
            moduleIndex,
            courseIndex,
        }: ParseContentManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<ContentEntity>>>> {
        const paths = await this.contentPathService.paths(
            {
                moduleRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<ContentEntity>>> = []
        for (const path of paths) {
            const content = await this.parse(
                {
                    paths,
                    courseIndex,
                    moduleIndex,
                    contentIndex: path.orderIndex,
                },
            )
            data.push({
                data: content,
                index: path.orderIndex,
                relativePath: path.relativePath,
            })
        }
        return data
    }
}
