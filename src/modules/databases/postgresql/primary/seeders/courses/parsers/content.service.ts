import type {
    ContentDataJson,
    ExtractParams,
    ExtractResult,
    ParseContentParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    readJsonFileOrDefault,
    readMdFileOrDefault,
} from "@modules/common"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractReferencesResult,
    ExtractReferencesService,
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
} from "../../../entities"
import {
    ContentDirService,
} from "../dir"

/**
 * Parses content from mounted course files.
 */
@Injectable()
export class ContentParserService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
        private readonly extractReferencesService: ExtractReferencesService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly contentReferenceIdFactoryService: ContentReferenceIdFactoryService,
        private readonly contentDirService: ContentDirService,
    ) {}

    /**
     * Reads the same top-level markdown section in English and Vietnamese.
     *
     * @param param - Heading key and locale markdown map
     * @returns Trimmed section bodies per locale
     */
    private extract(
        {
            key,
            markdownMap,
        }: ExtractParams,
    ): ExtractResult {
        const result = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            result.set(
                locale,
                this.extractBlockService.extract(
                    {
                        key,
                        markdown: markdownMap.get(locale) ?? "",
                    },
                )
            )
        }
        return result
    }

    /**
     * Builds a partial content entity from mounted course files.
     */
    parse(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseContentParams,
    ): DeepPartial<ContentEntity> {
        const {
            path,
            displayId,
        } = this.contentDirService.path(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
            },
        )
        const markdownMap = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            markdownMap.set(
                locale,
                readMdFileOrDefault(`${path}/${locale}.md`)
            )
        }
        const dataJson = readJsonFileOrDefault<ContentDataJson>(`${path}/data.json`)

        const titleMap = this.extract(
            {
                key: "Title",
                markdownMap,
            },
        )
        const descriptionMap = this.extract(
            {
                key: "Description",
                markdownMap,
            },
        )
        const bodyMap = this.extract(
            {
                key: "Body",
                markdownMap,
            },
        )

        const referencesTextMap = this.extract(
            {
                key: "References",
                markdownMap,
            },
        )
        const referencesMap = new Map<Locale, ExtractReferencesResult>()
        for (const locale of Object.values(Locale)) {
            referencesMap.set(locale, 
                this.extractReferencesService.extract(
                    {
                        markdown: referencesTextMap.get(locale) ?? "",
                    },
                )
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
            displayId,
            title: titleMap.get(Locale.En) ?? "",
            description: descriptionMap.get(Locale.En) ?? "",
            body: bodyMap.get(Locale.En) ?? "",
            orderIndex: contentIndex,
            minutesRead: dataJson.minutesRead ?? 0,
            translations: (() => {
                const translations: Array<DeepPartial<ContentTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        contentId,
                        locale,
                        field: "title",
                        value: titleMap.get(locale) ?? "",
                    })
                    translations.push({
                        contentId,
                        locale,
                        field: "description",
                        value: descriptionMap.get(locale) ?? "",
                    })
                }
                return translations
            })(),
            references: (
                referencesMap.get(Locale.En) ?? []
            ).map((reference) => {
                const referenceId = this.contentReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        referenceIndex: reference.orderIndex,
                    },
                )
                const translations = Array.from(referencesMap.entries()).map(
                    ([
                        locale,
                        references
                    ]) => (
                        references.map((reference) => ({
                            contentReferenceId: referenceId,
                            locale,
                            field: "alias",
                            value: reference.alias,
                        }
                        )
                        ))).flat()
                return {
                    id: referenceId,
                    orderIndex: reference.orderIndex,
                    alias: reference.alias,
                    defaultLocale: Locale.En,
                    url: reference.url,
                    content: {
                        id: contentId,
                    },
                    translations
                }
            }),
        }
    }
}
