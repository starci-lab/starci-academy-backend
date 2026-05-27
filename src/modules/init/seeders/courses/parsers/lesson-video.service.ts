import type {
    ParseLessonVideoManyParams,
    ParseLessonVideoParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    LessonVideoType,
    VideoHostPlatform,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    LessonVideoIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    LessonVideoEntity,
    LessonVideoTranslationEntity,
} from "@modules/databases"
import {
    LessonVideoPathService
} from "../path"
import {
    ResolvedFileResult,
    ContextLoaderService,
} from "../../shared"
import {
    LessonVideoPathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"

/**
 * Parses lesson video from `en.md` / `vi.md` with camelCase `#` headings (or optional `data.json`).
 */
@Injectable()
export class LessonVideoParserService {
    constructor(
        private readonly lessonVideoPathService: LessonVideoPathService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly lessonVideoIdFactoryService: LessonVideoIdFactoryService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Builds a partial lesson video entity from mounted course files.
     */
    async parse(
        {
            paths,
            courseIndex,
            moduleIndex,
            contentIndex,
            lessonVideoIndex,
        }: ParseLessonVideoParams,
    ): Promise<DeepPartial<LessonVideoEntity>> {
        const path = paths.find(
            (path) => path.orderIndex === lessonVideoIndex
        )
        if (!path) {
            throw new LessonVideoPathNotFoundException(
                {
                    lessonVideoIndex,
                },
            )
        }
        const jsonMap = new Map<Locale, Partial<LessonVideoEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load("courses", 
                        `${path.relativePath}/${locale}.md`,
                    ),
                )
            )
        }
        const lessonVideoId = this.lessonVideoIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
                lessonVideoIndex,
            },
        )
        return {
            id: lessonVideoId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            caption: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.caption,
            ),
            videoType: this.coerceMdScalarService.toNullableEnum(
                jsonMap.get(Locale.En)?.videoType,
                LessonVideoType,
            ),
            content: {
                id: this.contentIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                    },
                ),
            },
            hostPlatform: this.coerceMdScalarService.toNullableEnum(
                jsonMap.get(Locale.En)?.hostPlatform,
                VideoHostPlatform,
            ),
            url: this.coerceMdScalarService.toRequiredString(
                jsonMap.get(Locale.En)?.url,
                "",
            ),
            orderIndex: lessonVideoIndex,
            durationMs: this.coerceMdScalarService.toRequiredNumber(
                jsonMap.get(Locale.En)?.durationMs,
                0,
            ),
            translations: (() => {
                const translations: Array<DeepPartial<LessonVideoTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        lessonVideoId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        lessonVideoId,
                        locale,
                        field: "description",
                        value: jsonMap.get(locale)?.description ?? "",
                    })
                    translations.push({
                        lessonVideoId,
                        locale,
                        field: "caption",
                        value: jsonMap.get(locale)?.caption ?? "",
                    })
                }
                return translations
            })(),
            thumbnailUrl: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.thumbnailUrl,
            ),
        }
    }

    /**
     * Parses many lesson videos from the mount.
     *
     * @param contentRelativePath - Content relative path
     * @param courseIndex - Course index
     * @param moduleIndex - Module index
     * @param contentIndex - Content index
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
        {
            contentRelativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseLessonVideoManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<LessonVideoEntity>>>> {
        const paths = await this.lessonVideoPathService.paths(
            {
                contentRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<LessonVideoEntity>>> = []
        for (const path of paths) {
            try {
                const lessonVideo = await this.parse(
                    {
                        paths,
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        lessonVideoIndex: path.orderIndex,
                    },
                )
                data.push({
                    data: lessonVideo,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    LessonVideoEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}

