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
    ExtractJsonFromMdService,
    CoerceMdScalarService,
} from "../../shared"
import {
    CodeExplainingIdFactoryService,
    CodeImplementationIdFactoryService,
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
    ContentEntity,
    ContentTranslationEntity,
} from "@modules/databases"
import {
    ContextLoaderService 
} from "../../shared"
import {
    ContentPathNotFoundException,
} from "@modules/exceptions"
import {
    ContentPathService,
} from "../path"
import {
    getCodeExplainingsFromExtractJson,
    inferLangFromCodeFence,
} from "./utils"
import {
    ResolvedFileResult,
} from "../../shared"

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
        private readonly contextLoaderService: ContextLoaderService,
        private readonly contentPathService: ContentPathService,
    ) { }

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

