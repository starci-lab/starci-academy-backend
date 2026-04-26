import {
    Injectable,
} from "@nestjs/common"
import {
    CourseEntity,
} from "../entities"
import {
    Locale,
} from "../enums"
import {
    TranslationResolverService,
} from "./translation.service"
import {
    ContentResolverService,
} from "./content-resolver.service"
import {
    PrerequisiteResolverService,
} from "./prerequisite-resolver.service"
import {
    PreviewContentResolverService,
} from "./preview-content-resolver.service"
import {
    QnaResolverService,
} from "./qna-resolver.service"
import {
    ValuePropositionResolverService,
} from "./value-proposition-resolver.service"
import {
    LivestreamSessionResolverService,
} from "./livestream-session-resolver.service"

/**
 * Applies loaded translations for a course tree; nested module payloads use shared resolvers.
 */
@Injectable()
export class CourseResolverService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
        private readonly prerequisiteResolver: PrerequisiteResolverService,
        private readonly valuePropositionResolver: ValuePropositionResolverService,
        private readonly qnaResolver: QnaResolverService,
        private readonly contentResolver: ContentResolverService,
        private readonly previewContentResolver: PreviewContentResolverService,
        private readonly livestreamSessionResolver: LivestreamSessionResolverService,
    ) {}

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
                this.prerequisiteResolver.transform(
                    prerequisite,
                    locale,
                    courseFallback,
                )
                return prerequisite
            })
        }

        if (course.valuePropositions && course.valuePropositions.length > 0) {
            course.valuePropositions = course.valuePropositions.map((valueProposition) => {
                this.valuePropositionResolver.transform(
                    valueProposition,
                    locale,
                    courseFallback,
                )
                return valueProposition
            })
        }

        if (course.qnas && course.qnas.length > 0) {
            course.qnas = course.qnas.map((qna) => {
                this.qnaResolver.transform(
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
                    this.livestreamSessionResolver.transform(
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
                        this.contentResolver.transform(
                            content,
                            locale,
                            courseFallback,
                        )
                        return content
                    })
                }
                if (module.previewContents && module.previewContents.length > 0) {
                    module.previewContents = module.previewContents.map((previewContent) => {
                        this.previewContentResolver.transform(
                            previewContent,
                            locale,
                            courseFallback,
                        )
                        return previewContent
                    })
                }

                return module
            })
        }
        return course
    }
}
