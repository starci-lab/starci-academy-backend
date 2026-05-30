import type {
    ParseContentParams,
    ParseContentManyParams,
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
    CodeExplainingTranslationEntity,
    CodeImplementationTranslationEntity,
    ContentBodyV2Entity,
    ContentBodyV2TranslationEntity,
    ContentEntity,
    ContentTranslationEntity,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    ResolvedFileResult,
    ContextLoaderService,
    PathResolverService,
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
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Loads the SCHEMA V2 per-language lesson bodies from the `<content>/bodies/<N>-<lang>/` folder.
     * Each language folder (`0-typescript`, `1-java`, ...) holds one `vi.md` + `en.md`, each with the
     * standard mount sections `# lang` + `# body` (body markdown wrapped in one separator block) —
     * kept as separate files so a body never bloats the content's own `vi.md`/`en.md`. Returns one
     * `ContentBodyV2` bucket per language (default-locale `body` = English; per-locale variants in
     * `translations`).
     *
     * @param params - Content folder path + course/module/content ordinals + parent content id.
     * @returns The per-language body buckets (empty when the `bodies/` folder is absent).
     */
    private async parseBodiesV2(
        {
            contentRelativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
            contentId,
        }: {
            contentRelativePath: string
            courseIndex: number
            moduleIndex: number
            contentIndex: number
            contentId: string
        },
    ): Promise<Array<DeepPartial<ContentBodyV2Entity>>> {
        // list the indexed language folders (`{N}-{lang}`) under `bodies/`
        const langPaths = await this.pathResolverService.filePaths(
            "courses",
            `${contentRelativePath}/bodies`,
        )
        const buckets: Array<DeepPartial<ContentBodyV2Entity>> = []
        for (const langPath of langPaths) {
            // `displayId` is the slug after the index, i.e. the programming language
            const lang = langPath.displayId
            const orderIndex = langPath.orderIndex
            const contentBodyV2Id = this.contentBodyV2IdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                langIndex: orderIndex,
            })
            // each `{locale}.md` carries `# lang` + `# body` sections (standard mount format)
            const translations: Array<DeepPartial<ContentBodyV2TranslationEntity>> = []
            let defaultBody: string | null = null
            let resolvedLang = lang
            for (const locale of Object.values(Locale)) {
                let extracted: { lang?: unknown; body?: unknown } = {
                }
                try {
                    extracted = this.extractJsonFromMdService.extract(
                        await this.contextLoaderService.load(
                            "courses",
                            `${langPath.relativePath}/${locale}.md`,
                        ),
                    )
                } catch {
                    // locale file absent for this language → leave body null
                }
                const body = this.coerceMdScalarService.toNullableStringColumn(extracted.body)
                translations.push({
                    contentBodyV2Id,
                    locale,
                    body,
                })
                if (locale === Locale.En) {
                    defaultBody = body
                    // prefer the explicit `# lang` field; fall back to the folder slug
                    resolvedLang = this.coerceMdScalarService.toRequiredString(extracted.lang,
                        lang)
                }
            }
            buckets.push({
                id: contentBodyV2Id,
                orderIndex,
                lang: resolvedLang,
                body: defaultBody,
                defaultLocale: Locale.En,
                content: {
                    id: contentId,
                },
                translations,
            })
        }
        return buckets
    }

    /**
     * Builds a partial content entity from mounted course files.
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
            (path) => path.orderIndex === contentIndex
        )
        if (!path) {
            throw new ContentPathNotFoundException(
                {
                    contentIndex,
                },
            )
        }
        const jsonMap = new Map<Locale, Partial<ContentEntity>>()
        for (const locale of Object.values(Locale)) {   
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load("courses",
                        `${path.relativePath}/${locale}.md`),
                ),
            )
        }
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
        // per-language lesson bodies live in separate files under `<content>/bodies/<N>-<lang>/`
        const bodiesV2 = await this.parseBodiesV2(
            {
                contentRelativePath: path.relativePath,
                courseIndex,
                moduleIndex,
                contentIndex,
                contentId,
            },
        )
        return {
            id: contentId,
            moduleId,
            module: {
                id: moduleId,
            },
            defaultLocale: Locale.En,
            displayId: path.displayId,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            body: this.coerceMdScalarService.toRequiredString(
                jsonMap.get(Locale.En)?.body,
                "",
            ),
            orderIndex: contentIndex,
            minutesRead: this.coerceMdScalarService.toRequiredNumber(
                jsonMap.get(Locale.En)?.minutesRead,
                0,
            ),
            isPremium: this.coerceMdScalarService.toRequiredBoolean(
                (jsonMap.get(Locale.En) as Record<string, unknown>)?.isPremium,
                false,
            ),
            // `# verified` day marks this as SCHEMA V2 content (null for legacy)
            verified: this.coerceMdScalarService.toNullableDate(
                (jsonMap.get(Locale.En) as Record<string, unknown>)?.verified,
            ),
            translations: (() => {
                const translations: Array<DeepPartial<ContentTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        contentId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        contentId,
                        locale,
                        field: "description",
                        value: this.coerceMdScalarService.toRequiredString(
                            jsonMap.get(locale)?.description,
                            "",
                        ),
                    })
                    translations.push({
                        contentId,
                        locale,
                        field: "body",
                        value: this.coerceMdScalarService.toRequiredString(
                            jsonMap.get(locale)?.body,
                            "",
                        ),
                    })
                }
                return translations
            })(),
            codeExplainings: getCodeExplainingsFromExtractJson(
                jsonMap.get(Locale.En),
            ).map(({
                orderIndex,
                code,
                explain,
            }) => {
                const explainingId = this.codeExplainingIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    explainingIndex: orderIndex,
                })
                const codeMarkdown = this.coerceMdScalarService.toRequiredString(
                    code, 
                    "",
                )
                const explainMarkdown = this.coerceMdScalarService.toRequiredString(
                    explain, 
                    "",
                )
                const translations: Array<DeepPartial<CodeExplainingTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    const content = jsonMap.get(locale)
                    const localeRow = getCodeExplainingsFromExtractJson(
                        content,
                    ).find(
                        (row) => row.orderIndex === orderIndex,
                    )
                    if (!localeRow) {
                        continue
                    }
                    translations.push({
                        codeExplainingId: explainingId,
                        locale,
                        field: "code",
                        value: this.coerceMdScalarService.toRequiredString(
                            localeRow.code, 
                            "",
                        ),
                    })
                    translations.push({
                        codeExplainingId: explainingId,
                        locale,
                        field: "explain",
                        value: this.coerceMdScalarService.toRequiredString(
                            localeRow.explain, 
                            "",
                        ),
                    })
                }
                return {
                    id: explainingId,
                    orderIndex,
                    code: codeMarkdown,
                    lang: inferLangFromCodeFence(codeMarkdown),
                    explain: explainMarkdown,
                    defaultLocale: Locale.En,
                    content: {
                        id: contentId,
                    },
                    translations,
                }
            }),
            codeImplementations: (
                jsonMap.get(Locale.En)?.codeImplementations ?? []
            ).map(({
                orderIndex,
                lang,
                guide,
                example,
            }) => {
                const implementationId = this.codeImplementationIdFactoryService.generate({
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    implementationIndex: orderIndex,
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
                const translations: Array<DeepPartial<CodeImplementationTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    const content = jsonMap.get(locale)
                    const localeRow = (content?.codeImplementations ?? []).find(
                        (row) => row.orderIndex === orderIndex,
                    )
                    if (!localeRow) {
                        continue
                    }
                    translations.push({
                        codeImplementationId: implementationId,
                        locale,
                        field: "guide",
                        value: this.coerceMdScalarService.toRequiredString(
                            localeRow.guide,
                            "",
                        ),
                    })
                    translations.push({
                        codeImplementationId: implementationId,
                        locale,
                        field: "example",
                        value: this.coerceMdScalarService.toRequiredString(
                            localeRow.example, 
                            "",
                        ),
                    })
                }
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
                    translations,
                }
            }),
            // SCHEMA V2 per-language lesson bodies — loaded from the `bodies/<N>-<lang>/{vi,en}.md`
            // folder (pre-computed above; kept as separate files so each body stays manageable).
            bodiesV2,
            references: (
                jsonMap.get(Locale.En)?.references ?? []
            ).map(({
                orderIndex,
                alias,
                url,
            }) => {
                const referenceId = this.contentReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        referenceIndex: orderIndex,
                    },
                )
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        content
                    ]) => (
                        (content.references ?? [])
                            .filter((reference) => reference.orderIndex === orderIndex)
                            .map((reference) => [
                                {
                                    contentReferenceId: referenceId,
                                    locale,
                                    field: "alias",
                                    value: reference.alias,
                                },
                                {
                                    contentReferenceId: referenceId,
                                    locale,
                                    field: "url",
                                    value: reference.url,
                                },
                            ])
                    )
                ).flat().flat()
                return {
                    id: referenceId,
                    orderIndex,
                    alias,
                    url,
                    defaultLocale: Locale.En,
                    content: {
                        id: contentId,
                    },
                    translations
                }
            }),
        }
    }

    /**
     * Parses many contents from the mount.
     *
     * @param moduleRelativePath - Module relative path
     * @param courseIndex - Course index
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
        {
            moduleRelativePath,
            moduleIndex,
            courseIndex
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

