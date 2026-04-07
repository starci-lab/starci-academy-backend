import {
    Injectable,
} from "@nestjs/common"
import {
    CourseEntity,
    Locale,
    TranslationResolverService,
} from "@modules/databases"
import {
    ChallengeTransformerService,
} from "./challenge-transformer.service"
import {
    ContentTransformerService,
} from "./content-transformer.service"
import {
    LessonVideoTransformerService,
} from "./lesson-video-transformer.service"
import {
    PrerequisiteTransformerService,
} from "./prerequisite-transformer.service"
import {
    PreviewContentTransformerService,
} from "./preview-content-transformer.service"
import {
    QnaTransformerService,
} from "./qna-transformer.service"
import {
    ValuePropositionTransformerService,
} from "./value-proposition-transformer.service"
import {
    LivestreamSessionTransformerService,
} from "./livestream-session-transformer.service"

/**
 * Applies loaded translations for a course tree; nested module payloads use shared transformers.
 */
@Injectable()
export class CourseTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly prerequisiteTransformer: PrerequisiteTransformerService,
        private readonly valuePropositionTransformer: ValuePropositionTransformerService,
        private readonly qnaTransformer: QnaTransformerService,
        private readonly contentTransformer: ContentTransformerService,
        private readonly lessonVideoTransformer: LessonVideoTransformerService,
        private readonly challengeTransformer: ChallengeTransformerService,
        private readonly previewContentTransformer: PreviewContentTransformerService,
        private readonly livestreamSessionTransformer: LivestreamSessionTransformerService,
    ) {}

    /**
     * Applies translations to a course and nested entities.
     * @param course - The course to transform.
     * @param locale - The locale to transform the course to.
     * @returns The transformed course.
     */
    transform(
        course: CourseEntity,
        locale: Locale,
    ): CourseEntity {
        const courseFallback = course.defaultLocale
        course.title = this.translationResolver.resolve(
            {
                translations: course.translations,
                field: "title",
                locale,
                fallbackLocale: courseFallback,
            }
        )
        course.description = this.translationResolver.resolve(
            {
                translations: course.translations,
                field: "description",
                locale,
                fallbackLocale: courseFallback,
            }
        )
        if (course.prerequisites && course.prerequisites.length > 0) {
            course.prerequisites = course.prerequisites.map((prerequisite) => {
                this.prerequisiteTransformer.transform(
                    prerequisite,
                    locale,
                    courseFallback,
                )
                return prerequisite
            })
        }

        if (course.valuePropositions && course.valuePropositions.length > 0) {
            course.valuePropositions = course.valuePropositions.map((valueProposition) => {
                this.valuePropositionTransformer.transform(
                    valueProposition,
                    locale,
                    courseFallback,
                )
                return valueProposition
            })
        }

        if (course.qnas && course.qnas.length > 0) {
            course.qnas = course.qnas.map((qna) => {
                this.qnaTransformer.transform(
                    qna,
                    locale,
                    courseFallback,
                )
                return qna
            })
        }

        if (course.livestreamSessions?.length) {
            course.livestreamSessions = course.livestreamSessions.map(
                (session) => {
                    this.livestreamSessionTransformer.transform(
                        session,
                        locale,
                        courseFallback,
                    )
                    return session
                },
            )
        }

        if (course.modules && course.modules.length > 0) {
            course.modules = course.modules.map((module) => {
                module.title = this.translationResolver.resolve(
                    {
                        translations: module.translations,
                        field: "title",
                        locale,
                        fallbackLocale: courseFallback,
                    }
                )
                module.description = this.translationResolver.resolve(
                    {
                        translations: module.translations,
                        field: "description",
                        locale,
                        fallbackLocale: courseFallback,
                    }
                )
                if (module.contents && module.contents.length > 0) {
                    module.contents = module.contents.map((content) => {
                        this.contentTransformer.transform(
                            content,
                            locale,
                            courseFallback,
                        )
                        return content
                    })
                }
                if (module.previewContents && module.previewContents.length > 0) {
                    module.previewContents = module.previewContents.map((previewContent) => {
                        this.previewContentTransformer.transform(
                            previewContent,
                            locale,
                            courseFallback,
                        )
                        return previewContent
                    })
                }
                if (module.lessonVideos && module.lessonVideos.length > 0) {
                    module.lessonVideos = module.lessonVideos.map((lessonVideo) => {
                        this.lessonVideoTransformer.transform(
                            lessonVideo,
                            locale,
                            courseFallback,
                        )
                        return lessonVideo
                    })
                }
                if (module.challenges?.length) {
                    module.challenges = module.challenges.map((challenge) => {
                        this.challengeTransformer.transform(
                            challenge,
                            locale,
                            courseFallback,
                        )
                        return challenge
                    })
                }
                return module
            })
        }
        return course
    }
}
