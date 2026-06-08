import type {
    ContentsFromDatabaseParams,
    IsContentV2Params,
    ParseContentBodiesParams,
    ParseContentManyParams,
    ParseContentParams,
} from "./types"
import {
    ContentLegacyParserService,
} from "./content-legacy.service"
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
    EntityManager,
} from "typeorm"
import {
    ContentBodyEntity,
    ContentBodyTranslationEntity,
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
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
 * Content parser for mounted course files (`en.md`, `vi.md`).
 * Routes V2 vs legacy via {@link isV2} (`# verified`); V2 bodies live under `bodies/`.
 */
@Injectable()
export class ContentParserService {
    constructor(
        private readonly contentLegacyParserService: ContentLegacyParserService,
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
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * True when the mount carries a parseable `# verified` day (SCHEMA V2 marker).
     *
     * @param params - Content folder relative path.
     * @returns `true` for V2 content; `false` → use {@link ContentLegacyParserService}.
     */
    async isV2(
        params: IsContentV2Params,
    ): Promise<boolean> {
        const {
            relativePath,
        } = params
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            try {
                jsonMap.set(
                    locale,
                    this.extractJsonFromMdService.extract(
                        await this.contextLoaderService.load(
                            "courses",
                            `${relativePath}/${locale}.md`,
                        ),
                    ),
                )
            } catch {
                continue
            }
        }
        if (jsonMap.size === 0) {
            return false
        }
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: jsonMap.get(locale) ?? {
                },
            })),
            translateFields: [],
        }) as Record<string, unknown>
        return this.coerceMdScalarService.toNullableDate(merged.verified) !== null
    }

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
        // optional per-lesson captured E2E flows (`<content>/e2e.json` -> `{ flows: [...] }`);
        // null when the lesson ships no proof file. Read-only data for the lecture "E2E" tab.
        let e2eFlows: Array<Record<string, unknown>> | null = null
        try {
            const rawE2e = await this.contextLoaderService.load(
                "courses",
                `${path.relativePath}/e2e.json`,
            )
            const parsedE2e = JSON.parse(rawE2e) as { flows?: Array<Record<string, unknown>> }
            e2eFlows = Array.isArray(parsedE2e?.flows) ? parsedE2e.flows : null
        } catch {
            e2eFlows = null
        }
        // assemble the entity graph for TypeORM cascade save
        return {
            e2eFlows,
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
     * Parses many contents from the mount. V2 when {@link isV2}; otherwise legacy parser.
     *
     * @param params - Module path + course/module ordinals.
     * @returns Entity-shaped graphs for the content upsert service.
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
                const parseParams = {
                    paths,
                    courseIndex,
                    moduleIndex,
                    contentIndex: path.orderIndex,
                }
                const content = await this.isV2({
                    relativePath: path.relativePath,
                })
                    ? await this.parse(parseParams)
                    : await this.contentLegacyParserService.parse(parseParams)
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

    /**
     * Loads persisted contents for one module (DB inspection / sync checks).
     *
     * @param params - Course/module ordinals on the mount.
     * @returns Content rows keyed by deterministic `moduleId`.
     */
    async contentsFromDatabase(
        params: ContentsFromDatabaseParams,
    ): Promise<Array<ContentEntity>> {
        const {
            courseIndex,
            moduleIndex,
        } = params
        const moduleId = this.moduleIdFactoryService.generate({
            courseIndex,
            moduleIndex,
        })
        return this.entityManager.find(
            ContentEntity,
            {
                where: {
                    module: {
                        id: moduleId,
                    },
                },
            }
        )
    }
}
