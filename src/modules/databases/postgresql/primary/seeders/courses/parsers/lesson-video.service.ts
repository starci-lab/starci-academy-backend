import type {
    ExtractParams,
    ExtractResult,
    LessonVideoDataJson,
    ParseLessonVideoParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    readJsonFileOrDefault,
    readMdFileOrDefault,
} from "@modules/common"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
} from "../extracts"
import {
    LessonVideoIdFactoryService,
    ModuleIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    LessonVideoEntity,
    LessonVideoTranslationEntity,
} from "../../../entities"
import {
    LessonVideoDirService,
} from "../dir"

/**
 * Parses lesson video from mounted course files.
 */
@Injectable()
export class LessonVideoParserService {
    constructor(
        private readonly lessonVideoDirService: LessonVideoDirService,
        private readonly extractBlockService: ExtractBlockService,
        private readonly lessonVideoIdFactoryService: LessonVideoIdFactoryService,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
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
            result.set(
                locale,
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
     * Builds a partial lesson video entity from mounted course files.
     */
    parse(
        {
            courseIndex,
            moduleIndex,
            lessonVideoIndex,
        }: ParseLessonVideoParams,
    ): DeepPartial<LessonVideoEntity> {
        const {
            path,
            displayId,
        } = this.lessonVideoDirService.path(
            {
                courseIndex,
                moduleIndex,
                lessonVideoIndex,
            },
        )
        const markdownMap = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            markdownMap.set(
                locale,
                readMdFileOrDefault(`${path}/${locale}.md`)
            )
        }
        const dataJson = readJsonFileOrDefault<LessonVideoDataJson>(`${path}/data.json`)

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
        const captionMap = this.extract(
            {
                key: "Caption",
                markdownMap,
            },
        )

        const lessonVideoId = this.lessonVideoIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                lessonVideoIndex,
            },
        )

        const url = (dataJson.url ?? "").trim()
        const kind = dataJson.kind
        const hostPlatform = dataJson.hostPlatform
        const moduleId = this.moduleIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
            },
        )
        return {
            id: lessonVideoId,
            defaultLocale: Locale.En,
            displayId,
            title: titleMap.get(Locale.En) ?? "",
            description: descriptionMap.get(Locale.En) ?? "",
            caption: captionMap.get(Locale.En) ?? "",
            kind,
            module: {
                id: moduleId,
            },
            hostPlatform,
            url,
            orderIndex: lessonVideoIndex,
            durationMs: dataJson.durationMs ?? 0,
            translations: (() => {
                const translations: Array<DeepPartial<LessonVideoTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        lessonVideoId,
                        locale,
                        field: "title",
                        value: titleMap.get(locale) ?? "",
                    })
                    translations.push({
                        lessonVideoId,
                        locale,
                        field: "description",
                        value: descriptionMap.get(locale) ?? "",
                    })
                    translations.push({
                        lessonVideoId,
                        locale,
                        field: "caption",
                        value: captionMap.get(locale) ?? "",
                    })
                }
                return translations
            })(),
            thumbnailUrl: dataJson.thumbnailUrl,
        }
    }
}