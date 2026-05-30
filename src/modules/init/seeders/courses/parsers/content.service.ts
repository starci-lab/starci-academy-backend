import type {
    ParseContentBodiesParams,
    ParseContentManyParams,
    ParseContentParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "@modules/databases"
import {
    ContentBodyIdFactoryService,
    ContentIdFactoryService,
    ModuleIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ContentBodyEntity,
    ContentBodyTranslationEntity,
    ContentEntity,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    MergeJsonService,
    ResolvedFileResult,
    ContextLoaderService,
    PathResolverService,
    MergeJsonResult,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    ContentPathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"
import {
    ContentPathService,
} from "../path"

/**
 * Parses content from mounted course files (`en.md`, `vi.md`).
 * Scalar fields like `minutesRead` use camelCase `#` headings in `en.md`.
 */
@Injectable()
export class ContentParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
        private readonly contentBodyIdFactoryService: ContentBodyIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly pathResolverService: PathResolverService,
        private readonly contentPathService: ContentPathService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Loads SCHEMA V2 per-language lesson bodies from `<content>/bodies/<N>-<lang>/`.
     * Each folder holds `{locale}.md` with `# lang` + `# body`; default-locale body lives on
     * the bucket row and per-locale variants in `translations`.
     *
     * @param params - Content folder path + ordinals + parent content id.
     * @returns Per-language body buckets (empty when `bodies/` is absent).
     */
    private async parseBodies(
        {
            contentRelativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
            contentId,
        }: ParseContentBodiesParams,
    ): Promise<Array<DeepPartial<ContentBodyEntity>>> {
        const paths = await this.pathResolverService.filePaths(
            "courses",
            `${contentRelativePath}/bodies`,
        )
        const bodies: Array<DeepPartial<ContentBodyEntity>> = []
        for (const path of paths) {
            const bodiesJsonMap = new Map<Locale, DeepPartial<ContentBodyEntity>>()
            for (const locale of Object.values(Locale)) {
                try {
                    bodiesJsonMap.set(
                        locale,
                        this.extractJsonFromMdService.extract(
                            await this.contextLoaderService.load(
                                "courses",
                                `${path.relativePath}/${locale}.md`,
                            ),
                        ),
                    )
                } catch {
                    bodiesJsonMap.set(
                        locale,
                        {
                        },
                    )
                }
            }
            const folderLang = path.displayId
            const orderIndex = path.orderIndex
            const contentBodyId = this.contentBodyIdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                orderIndex,
            })
            const merged = this.mergeJsonService.merge({
                jsons: Object.values(Locale).map((locale) => ({
                    locale,
                    json: (bodiesJsonMap.get(locale) ?? {
                    }) as Record<string, unknown>,
                })),
                translateFields: [
                    "body",
                ],
            })
            const resolvedLang = this.coerceMdScalarService.toRequiredString(
                bodiesJsonMap.get(Locale.En)?.lang,
                folderLang,
            )
            const bodyTranslations: Array<DeepPartial<ContentBodyTranslationEntity>> =
                (merged.translations ?? [])
                    .filter(({ field }) => field === "body")
                    .map(({
                        locale,
                        value,
                    }) => ({
                        contentBodyId,
                        locale,
                        body: this.coerceMdScalarService.toNullableStringColumn(value),
                    }))
            bodies.push({
                id: contentBodyId,
                orderIndex,
                lang: resolvedLang,
                body: this.coerceMdScalarService.toNullableStringColumn(merged.body),
                defaultLocale: Locale.En,
                content: {
                    id: contentId,
                },
                translations: bodyTranslations,
            })
        }
        return bodies
    }

    /**
     * Builds a partial content entity (scalars, code blocks, references, bodies) from the mount.
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
        // locate the folder for this content ordinal
        const path = paths.find(
            (path) => path.orderIndex === contentIndex,
        )
        if (!path) {
            throw new ContentPathNotFoundException(
                {
                    contentIndex,
                },
            )
        }
        // extract the heading structure for every locale's markdown file
        const jsonMap = new Map<Locale, DeepPartial<ContentEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        "courses",
                        `${path.relativePath}/${locale}.md`,
                    ),
                ) as DeepPartial<ContentEntity>,
            )
        }
        // merge locales into one default-locale doc + translation rows for every i18n field;
        // codeExplainings is normalized first since the mount key may be singular (`codeExplaining`)
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: {
                    ...(jsonMap.get(locale) ?? {
                    }),
                } as Record<string, unknown>,
            })),
            translateFields: [
                "title",
                "description",
            ],
        }) as MergeJsonResult<DeepPartial<ContentEntity>>
        // deterministic content id (reused as FK + id chain root) and owning module id
        const contentId = this.contentIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
            },
        )
        const moduleId = this.moduleIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
            },
        )
        // SCHEMA V2 per-language lesson bodies under `<content>/bodies/<N>-<lang>/` (empty when absent)
        const bodies = await this.parseBodies({
            contentRelativePath: path.relativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
            contentId,
        })
        // assemble the entity graph for TypeORM cascade save
        return {
            id: contentId,
            moduleId,
            module: {
                id: moduleId,
            },
            defaultLocale: Locale.En,
            displayId: path.displayId,
            title: merged.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                merged.description,
            ),
            body: this.coerceMdScalarService.toRequiredString(
                merged.body,
                "",
            ),
            orderIndex: contentIndex,
            minutesRead: this.coerceMdScalarService.toRequiredNumber(
                merged.minutesRead,
                0,
            ),
            isPremium: this.coerceMdScalarService.toRequiredBoolean(
                merged.isPremium,
                false,
            ),
            // `# verified` day marks SCHEMA V2 content (null for legacy)
            verified: this.coerceMdScalarService.toNullableDate(
                merged.verified,
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
            bodies,
        }
    }

    /**
     * Parses many contents from the mount.
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
            try {
                // delegate the per-content build to parse(); skip + log on failure
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
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    ContentEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}
