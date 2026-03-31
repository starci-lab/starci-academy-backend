import {
    Injectable,
} from "@nestjs/common"
import {
    Locale,
    TranslationResolverService,
} from "@modules/databases"
import type {
    CourseEntity,
} from "@modules/databases"

/**
 * Applies loaded `translations` onto base fields for a course tree.
 *
 * Mutates the passed entities in-place (safe for request-scoped GraphQL reads).
 */
@Injectable()
export class CourseTransformerService {
    constructor(
        private readonly translationResolver: TranslationResolverService,
    ) {}

    /**
     * Transforms a course entity into a course entity with translations applied.
     * 
     * @param course - The course entity to transform.
     * @param locale - The locale to use for the translations.
     * @returns The transformed course entity.
     */
    transform(
        course: CourseEntity,
        locale: Locale,
    ): CourseEntity {
        course.title = this.translationResolver.resolve(
            {
                translations: course.translations,
                field: "title",
                locale,
                fallbackLocale: course.defaultLocale,
            }
        )
        // course description translations
        course.description = this.translationResolver.resolve(
            {
                translations: course.translations,
                field: "description",
                locale,
                fallbackLocale: course.defaultLocale,
            }
        )
        // prerequisite translations
        if (course.prerequisites && course.prerequisites.length > 0) {
            course.prerequisites = course.prerequisites.map(
                (prerequisite) => {
                    prerequisite.content = this.translationResolver.resolve(
                        {
                            translations: prerequisite.translations,
                            field: "content",
                            locale,
                            fallbackLocale: course.defaultLocale,
                        }
                    )
                    return prerequisite
                }
            )
        }

        // value proposition translations
        if (course.valuePropositions && course.valuePropositions.length > 0) {
            course.valuePropositions = course.valuePropositions.map(
                (valueProposition) => {
                    valueProposition.content = this.translationResolver.resolve(
                        {
                            translations: valueProposition.translations,
                            field: "content",
                            locale,
                            fallbackLocale: course.defaultLocale,
                        }
                    )
                    return valueProposition
                }
            )
        }

        // qna translations
        if (course.qnas && course.qnas.length > 0) {
            course.qnas = course.qnas.map((qna) => {
                qna.question = this.translationResolver.resolve(
                    {
                        translations: qna.translations,
                        field: "question",
                        locale,
                        fallbackLocale: course.defaultLocale,
                    }
                )
                qna.answer = this.translationResolver.resolve(
                    {
                        translations: qna.translations,
                        field: "answer",
                        locale,
                        fallbackLocale: course.defaultLocale,
                    }
                )
                return qna
            })
        }

        // module translations
        if (course.modules && course.modules.length > 0) {
            course.modules = course.modules.map((module) => {
                module.title = this.translationResolver.resolve(
                    {
                        translations: module.translations,
                        field: "title",
                        locale,
                        fallbackLocale: course.defaultLocale,
                    }
                )
                module.description = this.translationResolver.resolve(
                    {
                        translations: module.translations,
                        field: "description",
                        locale,
                        fallbackLocale: course.defaultLocale,
                    }
                )
                // content translations
                if (module.contents && module.contents.length > 0) {
                    module.contents = module.contents.map(
                        (content) => {
                            content.title = this.translationResolver.resolve(
                                {
                                    translations: content.translations,
                                    field: "title",
                                    locale,
                                    fallbackLocale: course.defaultLocale,
                                }
                            )
                            content.body = this.translationResolver.resolve(
                                {
                                    translations: content.translations,
                                    field: "body",
                                    locale,
                                    fallbackLocale: course.defaultLocale,
                                }
                            )
                            return content
                        }
                    )
                }
                // preview content translations
                if (module.previewContents && module.previewContents.length > 0) {
                    module.previewContents = module.previewContents.map(
                        (previewContent) => {
                            previewContent.data = this.translationResolver.resolve(
                                {
                                    translations: previewContent.translations,
                                    field: "data",
                                    locale,
                                    fallbackLocale: course.defaultLocale,
                                }
                            )
                            return previewContent
                        }
                    )
                }
                return module
            })
        }
        return course
    }
}

