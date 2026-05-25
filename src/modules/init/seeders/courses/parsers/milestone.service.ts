import type {
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
} from "../../shared"
import {
    CourseIdFactoryService,
    MilestoneIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
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
        const jsonMap = new Map<Locale, Record<string, any>>()
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
        const enJson = jsonMap.get(Locale.En) ?? {
        }
        return {
            id: milestoneId,
            orderIndex: milestoneIndex,
            title: enJson.title ?? "",
            description: enJson.description ?? "",
            defaultLocale: Locale.En,
            course: {
                id: courseId,
            },
            translations: (() => {
                const translations: Array<DeepPartial<MilestoneTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    const json = jsonMap.get(locale)
                    if (json?.title) {
                        translations.push({
                            milestoneId,
                            locale,
                            field: "title",
                            value: json.title as string,
                        })
                    }
                    if (json?.description) {
                        translations.push({
                            milestoneId,
                            locale,
                            field: "description",
                            value: json.description as string,
                        })
                    }
                }
                return translations
            })(),
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
        }
        return data
    }
}

