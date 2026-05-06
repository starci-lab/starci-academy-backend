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
} from "../extracts"
import {
    ContentIdFactoryService,
    ContentReferenceIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ContentEntity,
    ContentTranslationEntity,
} from "@modules/databases"
import {
    ContextLoaderService,
} from "../contexts"
import {
    ContentPathNotFoundException,
} from "@modules/exceptions"
import {
    ContentPathService,
    ResolvedFileResult,
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
        private readonly contentReferenceIdFactoryService: ContentReferenceIdFactoryService,
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
                    await this.contextLoaderService.load(`${path.relativePath}/${locale}.md`),
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
        return {
            id: contentId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            body: jsonMap.get(Locale.En)?.body ?? "",
            orderIndex: contentIndex,
            minutesRead: this.coerceMdScalarService.toRequiredNumber(
                jsonMap.get(Locale.En)?.minutesRead,
                0,
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
                        value: jsonMap.get(locale)?.description ?? "",
                    })
                    translations.push({
                        contentId,
                        locale,
                        field: "body",
                        value: jsonMap.get(locale)?.body ?? "",
                    })
                }
                return translations
            })(),
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
                            ]
                            )
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
