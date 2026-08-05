import {
    Injectable,
} from "@nestjs/common"
import {
    CourseContentTier,
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
@Injectable()
/**
 * Parses module readme from `en.md` / `vi.md` with camelCase `#` headings and indexed lists.
 */
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
            // pure display-ordering index (1-based) -- explicit `# sortIndex`, else orderIndex + 1
            sortIndex: this.toSortIndex(
                (merged as { sortIndex?: unknown }).sortIndex,
                moduleIndex + 1,
            ),
            // hard per-module paywall flag from `# isPremium` (false by default)
            isPremium: this.toBoolean(
                (merged as { isPremium?: unknown }).isPremium,
            ),
            // explicit tier from `# contentType` (foundation by default) -- display badge only
            contentTier: this.toContentTier(
                (merged as { contentType?: unknown }).contentType,
            ),
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
     * Coerces a raw `# contentType` mount value into a {@link CourseContentTier},
     * defaulting to `foundation` when missing or unrecognized.
     *
     * @param raw - Raw scalar read from the module mount file
     * @returns The resolved tier (never throws)
     */
    /**
     * Resolves the `# index` mount value (pure display order), falling back to the
     * module's `orderIndex` when it is missing or not a finite number.
     *
     * @param raw - Raw scalar read from the module mount file
     * @param fallback - The orderIndex to use when `# index` is absent
     * @returns The resolved sort index
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }

    /**
     * Coerces a raw `# isPremium` mount value into a boolean (default false).
     *
     * @param raw - Raw scalar read from the module mount file
     * @returns True only when the value is the string/boolean `true`
     */
    private toBoolean(raw: unknown): boolean {
        return raw === true
            || (typeof raw === "string" && raw.trim().toLowerCase() === "true")
    }

    private toContentTier(raw: unknown): CourseContentTier {
        const value = typeof raw === "string" ? raw.trim().toLowerCase() : ""
        return (Object.values(CourseContentTier) as Array<string>).includes(value)
            ? (value as CourseContentTier)
            : CourseContentTier.Foundation
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
