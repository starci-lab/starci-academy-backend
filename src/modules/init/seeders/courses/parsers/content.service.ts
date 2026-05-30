import type {
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
    CodeExplainingIdFactoryService,
    CodeImplementationIdFactoryService,
    ContentBodyV2IdFactoryService,
    ContentIdFactoryService,
    ContentReferenceIdFactoryService,
    ModuleIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ContentBodyV2Entity,
    ContentBodyV2TranslationEntity,
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
import {
    getCodeExplainingsFromExtractJson,
    inferLangFromCodeFence,
    type ContentExtractJson,
} from "./utils"

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
        private readonly contentReferenceIdFactoryService: ContentReferenceIdFactoryService,
        private readonly codeExplainingIdFactoryService: CodeExplainingIdFactoryService,
        private readonly codeImplementationIdFactoryService: CodeImplementationIdFactoryService,
        private readonly contentBodyV2IdFactoryService: ContentBodyV2IdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly pathResolverService: PathResolverService,
        private readonly contentPathService: ContentPathService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly winstonService: WinstonService,
    ) { }

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
        const langPaths = await this.pathResolverService.filePaths(
            "courses",
            `${path.relativePath}/bodies`,
        )
        const bodiesV2: Array<DeepPartial<ContentBodyV2Entity>> = []
        for (const langPath of langPaths) {
            // extract the heading structure for every locale's markdown file
        const bodiesJsonMap = new Map<Locale, DeepPartial<ContentBodyV2Entity>>()
        for (const locale of Object.values(Locale)) {
            bodiesJsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        "courses",
                        `${langPath.relativePath}/${locale}.md`,
                    ),
                ) as DeepPartial<ContentBodyV2Entity>,
            )
        }
            // folder displayId (e.g. `typescript`) is the fallback language label
            const lang = langPath.displayId
            // folder ordinal doubles as the deterministic langIndex + display order
            const langOrderIndex = langPath.orderIndex
            const contentBodyV2Id = this.contentBodyV2IdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                langIndex: langOrderIndex,
            })
            const mergedBody = this.mergeJsonService.merge({
                jsons: Object.values(Locale).map((locale) => ({
                    locale,
                    json: {
                        ...(jsonMap.get(locale) ?? {
                    },
                })),
            })
            bodiesV2.push({
                id: contentBodyV2Id,
                orderIndex: langOrderIndex,
                lang: resolvedLang,
                body: defaultBody,
                defaultLocale: Locale.En,
                content: {
                    id: contentId,
                },
                translations: bodyTranslations,
            })
        }
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
            codeExplainings: (
                merged.codeExplainings
                ?? getCodeExplainingsFromExtractJson(merged as ContentExtractJson)
            ).map(({
                orderIndex,
                code,
                explain,
                translations,
            }) => {
                const explainingId = this.codeExplainingIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    explainingIndex: orderIndex ?? 0,
                })
                const codeMarkdown = this.coerceMdScalarService.toRequiredString(
                    code,
                    "",
                )
                const explainMarkdown = this.coerceMdScalarService.toRequiredString(
                    explain,
                    "",
                )
                return {
                    id: explainingId,
                    orderIndex,
                    code: codeMarkdown,
                    // language is inferred from the code fence info string
                    lang: inferLangFromCodeFence(codeMarkdown),
                    explain: explainMarkdown,
                    defaultLocale: Locale.En,
                    content: {
                        id: contentId,
                    },
                    translations: (translations ?? []).map(
                        ({
                            locale,
                            field,
                            value,
                        }) => ({
                            codeExplainingId: explainingId,
                            locale,
                            field,
                            value,
                        }),
                    ),
                }
            }),
            codeImplementations: (
                merged.codeImplementations ?? []
            ).map(({
                orderIndex,
                lang,
                guide,
                example,
                translations,
            }) => {
                const implementationId = this.codeImplementationIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    implementationIndex: orderIndex ?? 0,
                })
                const langValue = this.coerceMdScalarService.toRequiredString(
                    lang,
                    "text",
                )
                const guideMarkdown = this.coerceMdScalarService.toRequiredString(
                    guide,
                    "",
                )
                const exampleMarkdown = this.coerceMdScalarService.toRequiredString(
                    example,
                    "",
                )
                return {
                    id: implementationId,
                    orderIndex,
                    lang: langValue,
                    guide: guideMarkdown,
                    example: exampleMarkdown,
                    defaultLocale: Locale.En,
                    content: {
                        id: contentId,
                    },
                    translations: (translations ?? []).map(
                        ({
                            locale,
                            field,
                            value,
                        }) => ({
                            codeImplementationId: implementationId,
                            locale,
                            field,
                            value,
                        }),
                    ),
                }
            }),
            bodiesV2,
            references: (
                merged.references ?? []
            ).map(({
                orderIndex,
                alias,
                url,
                translations,
            }) => {
                const referenceId = this.contentReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        referenceIndex: orderIndex ?? 0,
                    },
                )
                return {
                    id: referenceId,
                    orderIndex,
                    alias,
                    url,
                    defaultLocale: Locale.En,
                    content: {
                        id: contentId,
                    },
                    translations: (translations ?? []).map(
                        ({
                            locale,
                            field,
                            value,
                        }) => ({
                            contentReferenceId: referenceId,
                            locale,
                            field,
                            value,
                        }),
                    ),
                }
            }),
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
