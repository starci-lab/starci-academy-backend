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
                // pure display-ordering index — explicit `# sortIndex`, else falls back to orderIndex
                sortIndex: this.toSortIndex(
                    (merged as { sortIndex?: unknown }).sortIndex,
                    orderIndex,
                ),
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
     * Builds the lecture "E2E" tab flows by reading the audit trail DIRECTLY from
     * `<content>/.e2e/<lang>/flow-<N>-<slug>-<status>.md`. Each markdown proof becomes one flow
     * `{ id, lang, title, status, markdown }`. Status maps `done|pass` -> `"passed"` (FE shows PASS);
     * any other suffix (`fail|require-rerun|require-creds`) stays non-`"passed"` (FE shows FAIL).
     * Falls back to a legacy `<content>/e2e.json` (`{ flows: [...] }`) only when no `.e2e/` tree exists.
     *
     * @param contentRelativePath - Lesson folder path under the course context root.
     * @returns Flow records for `content.e2eFlows`, or `null` when no proof exists.
     */
    private async parseE2eFlows(
        contentRelativePath: string,
    ): Promise<Array<Record<string, unknown>> | null> {
        const flows: Array<Record<string, unknown>> = []
        const e2eRoot = `${contentRelativePath}/.e2e`
        // Language subdirs (typescript/java/csharp/go/agnostic) are non-indexed -> listRaw.
        const langs = await this.pathResolverService.listRaw(
            "courses",
            e2eRoot,
        )
        for (const lang of langs) {
            const files = await this.pathResolverService.listRaw(
                "courses",
                `${e2eRoot}/${lang}`,
            )
            // Keep only flow proof markdown; ignore summary.md / other artifacts.
            const flowFiles = files
                .filter((file) => /^flow-.*\.md$/u.test(file))
                .sort()
            for (const file of flowFiles) {
                let markdown = ""
                try {
                    markdown = await this.contextLoaderService.load(
                        "courses",
                        `${e2eRoot}/${lang}/${file}`,
                    )
                } catch {
                    continue
                }
                const base = file.replace(
                    /\.md$/u,
                    "",
                )
                // Trailing status token of `flow-<N>-<slug>-<status>`.
                const statusMatch = base.match(
                    /-(done|pass|fail|require-creds|require-rerun)$/u,
                )
                const rawStatus = statusMatch ? statusMatch[1] : "done"
                const status = (rawStatus === "done" || rawStatus === "pass")
                    ? "passed"
                    : rawStatus === "fail"
                        ? "failed"
                        : "pending"
                // Title: first markdown heading, else the filename stem.
                const headingMatch = markdown.match(
                    /^#{1,6}[ \t]+(.+?)\s*$/mu,
                )
                flows.push({
                    id: base,
                    lang,
                    title: headingMatch ? headingMatch[1].trim() : base,
                    status,
                    markdown,
                })
            }
        }
        if (flows.length > 0) {
            return flows
        }
        // Legacy fallback: a pre-generated `e2e.json` ({ flows: [...] }).
        try {
            const rawE2e = await this.contextLoaderService.load(
                "courses",
                `${contentRelativePath}/e2e.json`,
            )
            const parsedE2e = JSON.parse(rawE2e) as { flows?: Array<Record<string, unknown>> }
            return Array.isArray(parsedE2e?.flows) ? parsedE2e.flows : null
        } catch {
            return null
        }
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
        // Per-lesson captured E2E proof for the lecture "E2E" tab. Source of truth is the audit
        // trail `<content>/.e2e/<lang>/flow-<N>-<slug>-<status>.md` (read directly). Falls back to
        // a legacy `<content>/e2e.json` only when no `.e2e/` tree is present.
        const e2eFlows = await this.parseE2eFlows(path.relativePath)
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
            // pure display-ordering index — explicit `# sortIndex`, else falls back to orderIndex
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
     * Resolves the `# sortIndex` mount value (pure display order), falling back to the
     * given `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the mount file
     * @param fallback - The orderIndex to use when `# sortIndex` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback + 1
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
