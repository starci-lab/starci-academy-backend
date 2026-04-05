import type {
    ExtractModuleBlockBothParams,
    ExtractModuleBlockBothResult,
    ListModuleIndexesResult,
    ModuleDataJson,
    ModuleIndexesParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    readMdFileOrDefault,
    readJsonFileOrDefault,
} from "@modules/common"
import {
    ModuleSeedPreviewViMissingException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractBulletListItemsService,
} from "../extracts"
import {
    ModuleIdFactoryService,
    PreviewContentIdFactoryService,
} from "../id-factories"
import {
    courseAlias,
} from "../utils"
import {
    listNumericChildDirectoryIndices,
} from "./utils"
import {
    ParseModuleParams 
} from "./types"
import {
    DeepPartial 
} from "typeorm"
import {
    ModuleEntity 
} from "../../../entities"

/**
 * Parses module lesson video from `en.md`, `vi.md`, and `data.json` (Title, Description + stream metadata).
 */
@Injectable()
export class ModuleParserService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
        private readonly extractBulletListItemsService: ExtractBulletListItemsService,
        private readonly previewContentIdFactoryService: PreviewContentIdFactoryService,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
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
        }: ExtractModuleBlockBothParams,
    ): ExtractModuleBlockBothResult {
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
     * Directory containing `en.md`, `vi.md`, and `data.json` for one lesson video.
     *
     * @param param - Course, module, and lesson video indices
     * @returns Absolute path to that folder
     */
    private path(
        {
            courseIndex,
            moduleIndex,
        }: ParseModuleParams,
    ): string {
        return `${
            envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules/${moduleIndex}`
    }

    /**
     * Builds a partial lesson video entity from mounted course files.
     *
     * @param param - Course, module, and lesson video indices
     * @returns Entity-shaped object suitable for TypeORM cascade save
     */
    parse(
        {
            courseIndex,
            moduleIndex,
        }: ParseModuleParams,
    ): DeepPartial<ModuleEntity> {
        const path = this.path(
            {
                courseIndex,
                moduleIndex,
            },
        )

        const enMarkdown = readMdFileOrDefault(`${path}/en.md`)
        const viMarkdown = readMdFileOrDefault(`${path}/vi.md`)
        const dataJson = readJsonFileOrDefault<ModuleDataJson>(`${path}/data.json`)

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

        const previewContentsText = this.extractBlockBoth(
            {
                key: "Preview Contents",
                enMarkdown,
                viMarkdown,
            },
        )

        const enPreviewContents = this.extractBulletListItemsService.extract(
            previewContentsText.en,
        )
        const viPreviewContents = this.extractBulletListItemsService.extract(
            previewContentsText.vi,
        )

        const moduleId = this.moduleIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
            },
        )
        return {
            id: moduleId,
            displayId: dataJson.displayId,
            orderIndex: moduleIndex,
            defaultLocale: Locale.En,
            title: title.en,
            description: description.en,
            previewContents: enPreviewContents.map(
                (
                    { text, orderIndex }
                ) => {
                    const viPreviewContent = viPreviewContents.find(
                        (viPreviewContent) => viPreviewContent.orderIndex === orderIndex,
                    )
                    if (!viPreviewContent) {
                        throw new ModuleSeedPreviewViMissingException(
                            {
                                courseIndex,
                                moduleIndex,
                                orderIndex,
                            },
                        )
                    }
                    const previewContentId = this.previewContentIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            previewContentIndex: orderIndex,
                        },
                    )
                    return {
                        id: previewContentId,
                        defaultLocale: Locale.En,
                        data: text,
                        orderIndex,
                        translations: [
                            {
                                previewContentId,
                                locale: Locale.Vi,
                                field: "data",
                                value: viPreviewContent.text,
                            },
                        ],
                    }
                }),
            translations: [
                {
                    moduleId,
                    locale: Locale.Vi,
                    field: "title",
                    value: title.vi,
                },
                {
                    moduleId,
                    locale: Locale.Vi,
                    field: "description",
                    value: description.vi,
                },
            ],
        }
    }

    /**
     * Lists numeric `modules/{n}/` indices on the mount for a course.
     *
     * @param param - Course ordinal
     * @returns Sorted module folder indices
     */
    indexes(
        {
            courseIndex,
        }: ModuleIndexesParams,
    ): ListModuleIndexesResult {
        return listNumericChildDirectoryIndices(
            `${envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules`,
        )
    }
}
