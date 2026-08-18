import type {
    BuildOutcomesParams,
    ParseContentBodiesParams,
    ParseContentManyParams,
    ParseContentParams,
} from "./types/content"
import type {
    ContentsFromDatabaseParams,
} from "./types/from-database"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ContentBodyIdFactoryService,
} from "../id-factories/content-body.service"
import {
    ContentLearningOutcomeIdFactoryService,
} from "../id-factories/content-learning-outcome.service"
import {
    ContentIdFactoryService,
} from "../id-factories/content.service"
import {
    ModuleIdFactoryService,
} from "../id-factories/module.service"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    ContentBodyTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/content-body-translation.entity"
import {
    ContentBodyEntity,
} from "@modules/databases/postgresql/primary/entities/content-body.entity"
import {
    ContentLearningOutcomeTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/content-learning-outcome-translation.entity"
import {
    ContentLearningOutcomeEntity,
} from "@modules/databases/postgresql/primary/entities/content-learning-outcome.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    ContentDifficulty,
} from "@modules/databases/postgresql/primary/enums/content-difficulty"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ContextLoaderService,
} from "../../shared/contexts/loader.service"
import {
    CoerceMdScalarService,
} from "../../shared/extracts/coerce-md-scalar.service"
import {
    ExtractJsonFromMdService,
} from "../../shared/extracts/extract-json-from-md.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    MergeJsonService,
} from "../../shared/merge/merge.service"
import {
    MergeJsonResult,
} from "../../shared/merge/types/merge-json"
import {
    PathResolverService,
} from "../../shared/path/resolver.service"
import {
    ResolvedFileResult,
} from "../../shared/path/types"
import {
    ContentPathNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-path-not-found"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ContentPathService,
} from "../path/content.service"

@Injectable()
/**
 * Content parser for mounted course files (`en.md`, `vi.md`). Bodies live under `bodies/`.
 *
 * THERE IS ONE SCHEMA NOW. This used to route between two parsers on a `# verified` marker, and
 * the fork is gone with the V1 parser: everything mounted is read here. A content folder that was
 * relying on the old path because it never gained the marker now reads its `bodies/` folder like
 * every other one.
 */
export class ContentParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
        private readonly contentBodyIdFactoryService: ContentBodyIdFactoryService,
        private readonly contentLearningOutcomeIdFactoryService: ContentLearningOutcomeIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly pathResolverService: PathResolverService,
        private readonly contentPathService: ContentPathService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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
            // defensive: a body without a resolvable id would cascade a null-FK
            // translation (crashes the whole lesson's seed) -- skip it so the rest seeds.
            if (!contentBodyId) {
                continue
            }
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
                        // set the FK via the RELATION (not the raw `contentBodyId` column):
                        // `content_body_id` is BOTH the FK and part of the composite PK, and
                        // TypeORM's cascade derives it from the relation -- a raw-only value can
                        // land as null on insert (the observed content_body_translations crash).
                        contentBody: {
                            id: contentBodyId,
                        },
                        locale,
                        body: this.coerceMdScalarService.toNullableStringColumn(value),
                    }))
            bodies.push({
                id: contentBodyId,
                orderIndex,
                // pure display-ordering index -- explicit `# sortIndex`, else falls back to orderIndex
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
            // ORDER BY THE FLOW NUMBER, NOT BY THE NAME. `flow-<N>-<slug>-<status>.md`
            // carries its order in `<N>`, and a bare `.sort()` compares the names as
            // text -- so a lesson with ten or more flows lists `flow-10-...` between
            // `flow-1-...` and `flow-2-...`, and the FE renders the audit trail out of
            // sequence. Ties (and any name that does not parse) fall back to the name
            // so the result is still deterministic.
            const flowIndexOf = (file: string): number => {
                const match = /^flow-(\d+)-/u.exec(file)
                return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
            }
            const flowFiles = files
                .filter((file) => /^flow-.*\.md$/u.test(file))
                .sort((left,
                    right) => flowIndexOf(left) - flowIndexOf(right) || left.localeCompare(right))
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
     * Builds a partial content entity (scalars, code blocks, bodies) from the mount.
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
                "outcomes.text",
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
            // `# verified` day marks SCHEMA V2 content (null for legacy)
            verified: this.coerceMdScalarService.toNullableDate(
                merged.verified,
            ),
            // optional `# difficulty` badge (beginner/intermediate/advanced); null when unset/unknown
            difficulty: this.toDifficulty(
                (merged as { difficulty?: unknown }).difficulty,
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
            // ordered "what you will learn" bullets from `# outcomes` (array of `### text` items)
            outcomes: this.buildOutcomes(
                (merged as { outcomes?: Array<DeepPartial<ContentLearningOutcomeEntity>> }).outcomes
                    ?? [],
                {
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    contentId,
                },
            ),
            bodies,
        }
    }

    /**
     * Builds the localized "what you will learn" outcome rows from the merged `# outcomes` array.
     * Each bullet becomes a {@link ContentLearningOutcomeEntity} with a deterministic id and its
     * per-locale `text` overrides in {@link ContentLearningOutcomeTranslationEntity}.
     *
     * @param items - Merged outcome items (`{ orderIndex, text, translations }`).
     * @param ordinals - Course/module/content ordinals + parent content id for id-chaining.
     * @returns Entity-shaped outcome graph for TypeORM cascade save.
     */
    private buildOutcomes(
        items: Array<DeepPartial<ContentLearningOutcomeEntity>>,
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            contentId,
        }: BuildOutcomesParams,
    ): Array<DeepPartial<ContentLearningOutcomeEntity>> {
        return items.map((item) => {
            const orderIndex = item.orderIndex ?? 0
            const outcomeId = this.contentLearningOutcomeIdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                orderIndex,
            })
            const translations: Array<DeepPartial<ContentLearningOutcomeTranslationEntity>> =
                (item.translations ?? [])
                    .filter(({ field }) => field === "text")
                    .map(({
                        locale,
                        value,
                    }) => ({
                        contentLearningOutcomeId: outcomeId,
                        locale,
                        field: "text",
                        value,
                    }))
            return {
                id: outcomeId,
                content: {
                    id: contentId,
                },
                defaultLocale: Locale.En,
                text: item.text ?? "",
                orderIndex,
                sortIndex: orderIndex,
                translations,
            }
        })
    }

    /**
     * Coerces a raw `# difficulty` mount value into a {@link ContentDifficulty}, returning `null`
     * when the value is missing or not one of beginner/intermediate/advanced.
     *
     * @param raw - Raw scalar read from the content mount file.
     * @returns The resolved difficulty tier, or `null`.
     */
    private toDifficulty(raw: unknown): ContentDifficulty | null {
        const value = typeof raw === "string" ? raw.trim().toLowerCase() : ""
        return (Object.values(ContentDifficulty) as Array<string>).includes(value)
            ? (value as ContentDifficulty)
            : null
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
     * Parses many contents from the mount.
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
                // all mounted contents are SCHEMA V2 (legacy parser removed)
                const content = await this.parse(parseParams)
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
