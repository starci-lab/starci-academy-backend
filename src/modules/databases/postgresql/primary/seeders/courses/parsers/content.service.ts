import type {
    ParseContentParams,
} from "./types"
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
    CoerceMdScalarService,
} from "../extracts"
import {
    ContentIdFactoryService,
    ContentReferenceIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ContentEntity,
    ContentTranslationEntity,
} from "../../../entities"
import {
    ContentDirService,
    ChallengeDirService,
    LessonVideoDirService,
} from "../dir"
import {
    ChallengeParserService,
} from "./challenge.service"
import {
    LessonVideoParserService,
} from "./lesson-video.service"

/**
 * Parses content from mounted course files (`en.md`, `vi.md`).
 * Scalar fields like `minutesRead` use camelCase `#` headings in `en.md`.
 */
@Injectable()
export class ContentParserService {
    constructor(
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly contentReferenceIdFactoryService: ContentReferenceIdFactoryService,
        private readonly contentDirService: ContentDirService,
        private readonly challengeDirService: ChallengeDirService,
        private readonly challengeParserService: ChallengeParserService,
        private readonly lessonVideoDirService: LessonVideoDirService,
        private readonly lessonVideoParserService: LessonVideoParserService,
    ) { }

    /**
     * Builds a partial content entity from mounted course files.
     */
    parse(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseContentParams,
    ): DeepPartial<ContentEntity> {
        const {
            path,
            displayId,
        } = this.contentDirService.path(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
            },
        )
        const jsonMap = new Map<Locale, Partial<ContentEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    readMdFileOrDefault(`${path}/${locale}.md`)
                )
            )
        }
        const contentId = this.contentIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
            },
        )

        const content: DeepPartial<ContentEntity> = {
            id: contentId,
            defaultLocale: Locale.En,
            displayId,
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: this.coerceMdScalarService.toNullableStringColumn(
                jsonMap.get(Locale.En)?.description,
            ),
            body: jsonMap.get(Locale.En)?.body ?? "",
            orderIndex: contentIndex,
            minutesRead: this.coerceMdScalarService.toRequiredNumber(
                jsonMap.get(Locale.En)?.minutesRead,
                0,
            ),
            translations: (() => {
                const translations: Array<DeepPartial<ContentTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        contentId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        contentId,
                        locale,
                        field: "description",
                        value: jsonMap.get(locale)?.description ?? "",
                    })
                    translations.push({
                        contentId,
                        locale,
                        field: "body",
                        value: jsonMap.get(locale)?.body ?? "",
                    })
                }
                return translations
            })(),
            references: (
                jsonMap.get(Locale.En)?.references ?? []
            ).map(({
                orderIndex,
                alias,
                url,
            }) => {
                const referenceId = this.contentReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        referenceIndex: orderIndex,
                    },
                )
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        content
                    ]) => (
                        (content.references ?? [])
                            .filter((reference) => reference.orderIndex === orderIndex)
                            .map((reference) => [
                                {
                                    contentReferenceId: referenceId,
                                    locale,
                                    field: "alias",
                                    value: reference.alias,
                                },
                                {
                                    contentReferenceId: referenceId,
                                    locale,
                                    field: "url",
                                    value: reference.url,
                                },
                            ]
                            )
                    )
                ).flat().flat()
                return {
                    id: referenceId,
                    orderIndex,
                    alias,
                    url,
                    defaultLocale: Locale.En,
                    content: {
                        id: contentId,
                    },
                    translations
                }
            }),
            challenges: (() => {
                const challengeMounts = this.challengeDirService.indexes(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                    }
                )
                return challengeMounts.map(
                    (challengeIndex) => this.challengeParserService.parse(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            challengeIndex,
                        },
                    )
                )
            })(),
            lessons: (() => {
                const lessonVideoMounts = this.lessonVideoDirService.indexes(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                    }
                )
                return lessonVideoMounts.map(
                    (lessonVideoIndex) => this.lessonVideoParserService.parse(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            lessonVideoIndex,
                        },
                    )
                )
            })(),
        }

        return {
            ...content,
            numChallenges: content.challenges?.length ?? 0,
            numLessons: content.lessons?.length ?? 0,
        }
    }
}
