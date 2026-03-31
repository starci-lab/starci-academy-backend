import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CourseNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseRequest,
} from "./graphql-types"
import {
    TranslationResolverService,
} from "@modules/databases"

/**
 * Loads a single course from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class CourseService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly translationResolver: TranslationResolverService,
    ) {}

    /**
     * Entry: returns one course by primary id.
     *
     * @param request - Wrapper with course id
     * @param request.id - Course id
     * @throws {CourseNotFoundException} When no course exists for `id`.
     */
    async execute({
        id,
        locale,
    }: CourseRequest): Promise<CourseEntity> {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id,
                },
                /**
                 * Nested relations load children in one query tree (not entity `cascade`,
                 * which only applies to persist operations).
                 */
                relations: {
                    translations: true,
                    prerequisites: {
                        translations: true,
                    },
                    valuePropositions: {
                        translations: true,
                    },
                    qnas: {
                        translations: true,
                    },
                    pricingPhases: true,
                    modules: {
                        translations: true,
                        contents: {
                            translations: true,
                        },
                        previewContents: {
                            translations: true,
                        },
                        lessonVideos: true,
                    },
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException(
                {
                    id,
                }
            )
        }
        // resolve the title
        course.title = this.translationResolver.resolve(
            {
                translations: course.translations,
                field: "title",
                locale,
                fallbackLocale: course.defaultLocale,
            }
        )
        // resolve the description
        course.description = this.translationResolver.resolve(
            {
                translations: course.translations,
                field: "description",
                locale,
                fallbackLocale: course.defaultLocale,
            }
        )
        // resolve the prerequisites
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
        // resolve the value propositions
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
        // resolve the qnas
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
        // resolve the modules
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
            return module
        })
        // return the course
        return course
    }
}
