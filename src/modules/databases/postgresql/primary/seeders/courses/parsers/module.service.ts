import {
    Injectable,
} from "@nestjs/common"
import {
    readMdFileOrDefault,
} from "@modules/common"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractBulletListItemsService,
    MarkdownBulletListItem,
} from "../extracts"
import {
    ModuleIdFactoryService,
    PreviewContentIdFactoryService,
} from "../id-factories"
import {
    ParseModuleParams 
} from "./types"
import {
    ExtractParams,
} from "./types"
import {
    ExtractResult,
} from "./types"
import {
    DeepPartial 
} from "typeorm"
import {
    ModuleEntity, 
    ModuleTranslationEntity,
    PreviewContentTranslationEntity, 
} from "../../../entities"
import {
    ModuleDirService 
} from "../dir"
import {
    CourseIdFactoryService,
} from "../id-factories"

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
        private readonly moduleDirService: ModuleDirService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

    /**
     * Reads the same top-level markdown section in many locales.
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
            result.set(locale,
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
     * Builds a partial module entity from mounted course files.
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
        const {
            path,
            displayId,
        } = this.moduleDirService.path(
            {
                courseIndex,
                moduleIndex,
            },
        )
        const courseId = this.courseIdFactoryService.generate(
            {
                courseIndex,
            },
        )
        const markdownMap = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            markdownMap.set(locale,
                readMdFileOrDefault(`${path}/${locale}.md`))
        }

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

        const previewContentsTextMap = this.extract(
            {
                key: "Preview Contents",    
                markdownMap,
            },
        )
        const previewContentsMap = new Map<Locale, Array<MarkdownBulletListItem>>()
        for (const locale of Object.values(Locale)) {
            previewContentsMap.set(
                locale,
                this.extractBulletListItemsService.extract(
                    previewContentsTextMap.get(locale) ?? "")
            )
        }
        const moduleId = this.moduleIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
            },
        )
        return {
            id: moduleId,
            displayId,
            courseId,
            orderIndex: moduleIndex,
            defaultLocale: Locale.En,
            title: titleMap.get(Locale.En) ?? "",
            description: descriptionMap.get(Locale.En) ?? "",
            previewContents: (
                previewContentsMap.get(Locale.En) ?? []
            ).map(
                (
                    {
                        text,
                        orderIndex,
                    },
                ) => {
                    const previewContentId = this.previewContentIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            previewContentIndex: orderIndex,
                        },
                    )
                    const translations = Array.from(
                        previewContentsMap.entries()
                    )
                        .map((
                            [
                                locale,
                                items
                            ]
                        ) => items.map<DeepPartial<PreviewContentTranslationEntity>>(
                            (item) => ({
                                previewContentId,
                                locale,
                                value: item.text,
                                field: "text",
                            })
                        )
                        )
                        .flat()
                    return {
                        moduleId,
                        id: previewContentId,
                        defaultLocale: Locale.En,
                        text,
                        orderIndex,
                        translations
                    }
                },
            ),
            translations: (
                () => {
                    const translations: Array<DeepPartial<ModuleTranslationEntity>> = []
                    for (const locale of Object.values(Locale)) {
                        translations.push(
                            {
                                moduleId,
                                locale,
                                field: "title",
                                value: titleMap.get(locale) ?? "",
                            }
                        )
                        translations.push(
                            {
                                moduleId,
                                locale,
                                field: "description",
                                value: descriptionMap.get(locale) ?? "",
                            }
                        )
                    }
                    return translations
                }
            )()
        }
    }
}
