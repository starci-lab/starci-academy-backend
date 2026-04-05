import type {
    ContentDataJson,
    ContentIndexesParams,
    ExtractContentBlockBothParams,
    ExtractContentBlockBothResult,
    ListContentIndexesResult,
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
    envConfig,
} from "@modules/env"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractReferencesService,
} from "../extracts"
import {
    ContentIdFactoryService,
    ContentReferenceIdFactoryService,
} from "../id-factories"
import {
    courseAlias,
} from "../utils"
import {
    DeepPartial 
} from "typeorm"
import {
    ContentEntity 
} from "../../../entities"
import {
    ContentSeedReferenceViMissingException,
} from "@modules/exceptions"
import {
    listNumericChildDirectoryIndices,
} from "./utils"

/**
 * Parses module content from `en.md`, `vi.md`, and `data.json` (Title, Description, Body, References).
 */
@Injectable()
export class ContentParserService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
        private readonly extractReferencesService: ExtractReferencesService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly contentReferenceIdFactoryService: ContentReferenceIdFactoryService,
    ) {}

    /**
     * Reads the same top-level markdown section in English and Vietnamese.
     *
     * @param param - Heading key and both locale documents
     * @returns Trimmed section bodies per locale
     */
    private extractBlockBoth(
        {
            key,
            enMarkdown,
            viMarkdown,
            numHashs = 1,
        }: ExtractContentBlockBothParams,
    ): ExtractContentBlockBothResult {
        return {
            en: this.extractBlockService.extract(
                {
                    key,
                    markdown: enMarkdown,
                    numHashs,
                },
            ),
            vi: this.extractBlockService.extract(
                {
                    key,
                    markdown: viMarkdown,
                    numHashs,
                },
            ),
        }
    }

    /**
     * Directory that holds `en.md`, `vi.md`, and `data.json` for one content slot.
     *
     * @param param - Course, module, and content indices
     * @returns Absolute path to the content folder
     */
    private path(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseContentParams,
    ): string {
        return `${
            envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules/${moduleIndex}/contents/${contentIndex}`
    }

    /**
     * Builds a partial content entity from mounted course files.
     *
     * @param param - Course, module, and content indices
     * @returns Entity-shaped object suitable for TypeORM cascade save
     */
    parse(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseContentParams,
    ): DeepPartial<ContentEntity> {
        const path = this.path(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
            },
        )

        // load locale markdown and optional JSON metadata
        const enMarkdown = readMdFileOrDefault(`${path}/en.md`)
        const viMarkdown = readMdFileOrDefault(`${path}/vi.md`)
        const dataJson = readJsonFileOrDefault<ContentDataJson>(`${path}/data.json`)

        const title = this.extractBlockBoth(
            {
                key: "Title",
                enMarkdown,
                viMarkdown,
            },
        )
        const description = this.extractBlockBoth(
            {
                key: "Description",
                enMarkdown,
                viMarkdown,
            },
        )
        const body = this.extractBlockBoth(
            {
                key: "Body",
                enMarkdown,
                viMarkdown,
            },
        )

        const referencesOuter = this.extractBlockBoth(
            {
                key: "References",
                enMarkdown,
                viMarkdown,
            },
        )
        const enReferences = this.extractReferencesService.extract(
            {
                markdown: referencesOuter.en,
            },
        )
        const viReferences = this.extractReferencesService.extract(
            {
                markdown: referencesOuter.vi,
            },
        )

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
            title: title.en,
            description: description.en,
            body: body.en,
            orderIndex: contentIndex,
            minutesRead: dataJson.minutesRead ?? 0,
            translations: [
                {
                    contentId,
                    locale: Locale.Vi,
                    field: "title",
                    value: title.vi,
                },
                {
                    contentId,
                    locale: Locale.Vi,
                    field: "description",
                    value: description.vi,
                },
                {
                    contentId,
                    locale: Locale.Vi,
                    field: "body",
                    value: body.vi,
                },
            ],
            references: enReferences.map((enReference) => {
                const viReference = viReferences.find(
                    (reference) => reference.orderIndex === enReference.orderIndex,
                )
                if (!viReference) {
                    throw new ContentSeedReferenceViMissingException(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            orderIndex: enReference.orderIndex,
                            alias: enReference.alias,
                        },
                    )
                }
                const referenceId = this.contentReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        referenceIndex: enReference.orderIndex,
                    },
                )
                return {
                    id: referenceId,
                    orderIndex: enReference.orderIndex,
                    alias: enReference.alias,
                    defaultLocale: Locale.En,
                    url: enReference.url,
                    translations: [
                        {
                            contentReferenceId: referenceId,
                            locale: Locale.Vi,
                            field: "alias",
                            value: viReference.alias,
                        },
                    ],
                }
            }),
        }
    }

    /**
     * Lists numeric `contents/{n}/` indices on the mount for a module.
     *
     * @param param - Course and module ordinals
     * @returns Sorted content folder indices
     */
    indexes(
        {
            courseIndex,
            moduleIndex,
        }: ContentIndexesParams,
    ): ListContentIndexesResult {
        return listNumericChildDirectoryIndices(
            `${envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules/${moduleIndex}/contents`,
        )
    }
}
