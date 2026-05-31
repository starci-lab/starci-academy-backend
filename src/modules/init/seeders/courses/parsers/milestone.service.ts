import type {
    MilestonesFromDatabaseParams,
    ParseMilestoneParams,
    ParseMilestoneManyParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    MilestoneEntity,
    MilestoneTranslationEntity,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    MergeJsonService,
    MergeJsonResult,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    CourseIdFactoryService,
    MilestoneIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    ContextLoaderService,
    ResolvedFileResult,
} from "../../shared"
import {
    MilestonePathNotFoundException,
} from "@modules/exceptions"
import {
    MilestonePathService,
} from "../path"
import {
    WinstonService,
} from "@modules/winston"
/**
 * Parses milestone data from mounted course files (`en.md`, `vi.md`).
 */
@Injectable()
export class MilestoneParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        private readonly milestoneIdFactoryService: MilestoneIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly milestonePathService: MilestonePathService,
        private readonly mergeJsonService: MergeJsonService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Builds a partial milestone entity from mounted course files.
     */
    async parse(
        {
            paths,
            courseIndex,
            milestoneIndex,
        }: ParseMilestoneParams,
    ): Promise<DeepPartial<MilestoneEntity>> {
        const path = paths.find(
            (path) => path.orderIndex === milestoneIndex,
        )
        if (!path) {
            throw new MilestonePathNotFoundException(
                {
                    milestoneIndex,
                },
            )
        }
        // extract the heading structure for every locale's markdown file
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load("courses",
                        `${path.relativePath}/${locale}.md`),
                ),
            )
        }
        const courseId = this.courseIdFactoryService.generate(
            {
                courseIndex,
            },
        )
        const milestoneId = this.milestoneIdFactoryService.generate(
            {
                courseIndex,
                milestoneIndex,
            },
        )
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
            ],
        }) as MergeJsonResult<DeepPartial<MilestoneEntity>>
        return {
            id: milestoneId,
            orderIndex: milestoneIndex,
            title: merged.title ?? "",
            description: merged.description ?? "",
            defaultLocale: Locale.En,
            course: {
                id: courseId,
            },
            // skip empty values to match the legacy behaviour of only pushing truthy fields
            translations: (merged.translations ?? [])
                .filter(({ value }) => Boolean(value))
                .map(({
                    locale,
                    field,
                    value,
                }): DeepPartial<MilestoneTranslationEntity> => ({
                    milestoneId,
                    locale,
                    field,
                    value,
                })),
        }
    }

    /**
     * Parses many milestones from the mount.
     *
     * @param courseRelativePath - Course relative path
     * @param courseIndex - Course index
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
        }: ParseMilestoneManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<MilestoneEntity>>>> {
        const paths = await this.milestonePathService.paths(
            {
                courseRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<MilestoneEntity>>> = []
        for (const path of paths) {
            try {
                const milestone = await this.parse(
                    {
                        paths,
                        courseIndex,
                        milestoneIndex: path.orderIndex,
                    },
                )
                data.push({
                    data: milestone,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    MilestoneEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Loads persisted milestones for one course (DB inspection / sync checks).
     *
     * @param params - Course ordinal on the mount.
     * @returns Milestone rows keyed by deterministic `courseId`.
     */
    async milestonesFromDatabase(
        params: MilestonesFromDatabaseParams,
    ): Promise<Array<MilestoneEntity>> {
        const {
            courseIndex,
        } = params
        const courseId = this.courseIdFactoryService.generate({
            courseIndex,
        })
        return this.entityManager.find(MilestoneEntity, {
            where: {
                course: {
                    id: courseId,
                },
            },
        })
    }
}

