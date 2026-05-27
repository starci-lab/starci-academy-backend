import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    CourseIdFactoryService,
    ModuleIdFactoryService,
    PreviewContentIdFactoryService,
} from "../id-factories"
import {
    ParseModuleManyParams,
    ParseModuleParams,
} from "./types"
import {
    DeepPartial,
} from "typeorm"
import {
    ModuleEntity,
    ModuleTranslationEntity,
    PreviewContentTranslationEntity,
} from "@modules/databases"
import {
    ResolvedFileResult,
    ContextLoaderService 
} from "../../shared"
import {
    ModulePathNotFoundException,
} from "@modules/exceptions"
import {
    ModulePathService,
} from "../path"
import {
    WinstonService,
} from "@modules/winston"
/**
 * Parses module readme from `en.md` / `vi.md` with camelCase `#` headings and indexed lists.
 */
@Injectable()
export class ModuleParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly previewContentIdFactoryService: PreviewContentIdFactoryService,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        private readonly modulePathService: ModulePathService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Builds a partial module entity from mounted course files.
     *
     * @param param - Course, module, and lesson video indices
     * @returns Entity-shaped object suitable for TypeORM cascade save
     */
    async parse(
        {
            paths,
            moduleIndex,
            courseIndex,
        }: ParseModuleParams,
    ): Promise<DeepPartial<ModuleEntity>> {
        const path = paths.find(
            (path) => path.orderIndex === moduleIndex
        )
        if (!path) {
            throw new ModulePathNotFoundException(
                {
                    moduleIndex,
                },
            )
        }
        const jsonMap = new Map<Locale, Partial<ModuleEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        "courses",
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        const courseId = this.courseIdFactoryService.generate(
            {
                courseIndex,
            },
        )
        const moduleId = this.moduleIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
            },
        )
        return {
            id: moduleId,
            displayId: path.displayId,
            course: {
                id: courseId,
            },
            orderIndex: moduleIndex,
            defaultLocale: Locale.En,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: jsonMap.get(Locale.En)?.description ?? "",
            previewContents: (
                jsonMap.get(Locale.En)?.previewContents ?? []
            ).map(({
                text,
                orderIndex,
            }) => {
                const previewContentId = this.previewContentIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        previewContentIndex: orderIndex,
                    },
                )
                const translations = Array.from(jsonMap.entries())
                    .map(([
                        locale,
                        module,
                    ]) => (module.previewContents ?? [])
                        .filter((previewContent) => previewContent.orderIndex === orderIndex)
                        .map<DeepPartial<PreviewContentTranslationEntity>>(
                            (previewContent) => ({
                                previewContentId,
                                locale,
                                value: previewContent.text,
                                field: "text",
                            }),
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
                    translations,
                }
            }),
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

    /**
     * Parses many modules from the mount.
     *
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
        }: ParseModuleManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<ModuleEntity>>>> {
        const paths = await this.modulePathService.paths(
            {
                courseRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<ModuleEntity>>> = []
        for (const path of paths) {
            try {
                const module = await this.parse(
                    {
                        paths,
                        moduleIndex: path.orderIndex,
                        courseIndex,
                    },
                )
                data.push({
                    data: module,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    ModuleEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}

