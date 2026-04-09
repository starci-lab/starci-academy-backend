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
    ExtractJsonFromMdService,
} from "../extracts"
import {
    CourseIdFactoryService,
    ModuleIdFactoryService,
    PreviewContentIdFactoryService,
} from "../id-factories"
import {
    ParseModuleParams,
} from "./types"
import {
    DeepPartial,
} from "typeorm"
import {
    ModuleEntity,
    ModuleTranslationEntity,
    PreviewContentTranslationEntity,
} from "../../../entities"
import {
    ModuleDirService,
} from "../dir"
/**
 * Parses module readme from `en.md` / `vi.md` with camelCase `#` headings and indexed lists.
 */
@Injectable()
export class ModuleParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly previewContentIdFactoryService: PreviewContentIdFactoryService,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
        private readonly moduleDirService: ModuleDirService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
    ) {}

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
        const jsonMap = new Map<Locale, Partial<ModuleEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(locale,
                this.extractJsonFromMdService.extract(
                    readMdFileOrDefault(`${path}/${locale}.md`)
                )
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
            course: {
                id: courseId,
            },
            orderIndex: moduleIndex,
            defaultLocale: Locale.En,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: jsonMap.get(Locale.En)?.description ?? "",
            previewContents: (
                jsonMap.get(Locale.En)?.previewContents ?? []
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
                        jsonMap.entries()
                    )
                        .map((
                            [
                                locale,
                                module
                            ]
                        ) => (module.previewContents ?? [])
                            .filter((previewContent) => previewContent.orderIndex === orderIndex)
                            .map<DeepPartial<PreviewContentTranslationEntity>>(
                                (previewContent) => ({
                                    previewContentId,
                                    locale,
                                    value: previewContent.text,
                                    field: "text",
                                })
                            ))
                        .flat()
                    return {
                        module: {
                            id: moduleId,
                        },
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
                                value: jsonMap.get(locale)?.title ?? "",
                            }
                        )
                        translations.push(
                            {
                                moduleId,
                                locale,
                                field: "description",
                                value: jsonMap.get(locale)?.description ?? "",
                            }
                        )
                    }
                    return translations
                }
            )()
        }
    }
}
