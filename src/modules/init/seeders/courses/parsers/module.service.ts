import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    MergeJsonService,
    MergeJsonResult,
    ResolvedFileResult,
    ContextLoaderService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    CourseIdFactoryService,
    ModuleIdFactoryService,
    PreviewContentIdFactoryService,
} from "../id-factories"
import type {
    ModulesFromDatabaseParams,
    ParseModuleManyParams,
    ParseModuleParams,
} from "./types"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
    PreviewContentEntity,
} from "@modules/databases"
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
        private readonly mergeJsonService: MergeJsonService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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
        // extract the heading structure for every locale's markdown file
        const jsonMap = new Map<Locale, Record<string, unknown>>()
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
        // merge locales into one default-locale doc + aligned translation rows per i18n field
        const merged = this.mergeJsonService.merge({
            jsons: Object.values(Locale).map((locale) => ({
                locale,
                json: jsonMap.get(locale) ?? {
                },
            })),
            translateFields: [
                "title",
                "description",
                "previewContents.text",
            ],
        }) as MergeJsonResult<DeepPartial<ModuleEntity>>
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
            title: merged.title ?? "",
            description: merged.description ?? "",
            previewContents: ((merged.previewContents ?? []) as Array<DeepPartial<PreviewContentEntity>>).map((item) => {
                const previewContentId = this.previewContentIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        previewContentIndex: item.orderIndex ?? 0,
                    },
                )
                return {
                    id: previewContentId,
                    module: {
                        id: moduleId,
                    },
                    defaultLocale: Locale.En,
                    text: item.text ?? "",
                    orderIndex: item.orderIndex,
                    translations: (item.translations ?? []).map(({
                        locale,
                        field,
                        value,
                    }) => ({
                        previewContentId,
                        locale,
                        field,
                        value,
                    })),
                }
            }),
            translations: (merged.translations ?? []).map(
                ({
                    locale,
                    field,
                    value,
                }) => ({
                    moduleId,
                    locale,
                    field,
                    value,
                }),
            ),
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

    /**
     * Loads persisted modules for one course (DB inspection / sync checks).
     *
     * @param params - Course ordinal on the mount.
     * @returns Module rows keyed by deterministic `courseId`.
     */
    async modulesFromDatabase(
        params: ModulesFromDatabaseParams,
    ): Promise<Array<ModuleEntity>> {
        const {
            courseIndex,
        } = params
        const courseId = this.courseIdFactoryService.generate({
            courseIndex,
        })
        return this.entityManager.find(ModuleEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
            })
    }
}
