import type {
    ParseLessonVideoParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    readMdFileOrDefault,
} from "@modules/common"
import {
    Locale,
    LessonVideoKind,
    VideoHostPlatform,
} from "../../../enums"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
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
 * Parses lesson video from `en.md` / `vi.md` with camelCase `#` headings (or optional `data.json`).
 */
@Injectable()
export class LessonVideoParserService {
    constructor(
        private readonly lessonVideoDirService: LessonVideoDirService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly lessonVideoIdFactoryService: LessonVideoIdFactoryService,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
    ) {}

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
        const jsonMap = new Map<Locale, Partial<LessonVideoEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    readMdFileOrDefault(`${path}/${locale}.md`)
                )
            )
        }
        const lessonVideoId = this.lessonVideoIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                lessonVideoIndex,
            },
        )
        return {
            id: lessonVideoId,
            defaultLocale: Locale.En,
            displayId,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            caption: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.caption,
            ),
            kind: this.coerceMdScalarService.toNullableEnum(
                jsonMap.get(Locale.En)?.kind,
                LessonVideoKind,
            ),
            module: {
                id: this.moduleIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
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
}
