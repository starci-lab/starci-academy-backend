import {
    CourseEntity,
    CourseTranslationEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import _ from "lodash"
import type {
    UpdateParams,
} from "./types"
import {
    courseTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import {
    ModuleService,
} from "./module.service"
import {
    PrerequisiteService,
} from "./prerequisite.service"
import {
    QnaService,
} from "./qna.service"
import {
    PricingPhaseService,
} from "./pricing-phase.service"
import {
    ValuePropositionService,
} from "./value-proposition.service"

/**
 * The service for Courses.
 *
 * Syncs data from `primary/data/courses` into DB, using the same update pattern as `QnaService`.
 */
@Injectable()
export class CoursesService {
    constructor(
        private readonly prerequisiteService: PrerequisiteService,
        private readonly qnaService: QnaService,
        private readonly pricingPhaseService: PricingPhaseService,
        private readonly valuePropositionService: ValuePropositionService,
        private readonly moduleService: ModuleService,
    ) {}

    /**
     * Update the translation.
     * @param params - The parameters for updating the translation.
     * @param params.previous - The previous translation.
     * @param params.updated - The updated translation.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateTranslation(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<CourseTranslationEntity>
    ) {
        await entityManager.update(
            CourseTranslationEntity,
            {
                courseId: previous.courseId,
                locale: previous.locale,
                field: previous.field,
            },
            sanitizePrimitiveFields(updated),
        )
    }

    /**
     * Update the translations.
     * @param params - The parameters for updating the translations.
     * @param params.previous - The previous translations.
     * @param params.updated - The updated translations.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateTranslations(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<CourseTranslationEntity>>
    ) {
        // we get the deleted translations
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            courseTranslationKey,
        )
        const createdTranslations = _.differenceBy(
            updated,
            previous,
            courseTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            courseTranslationKey,
        )

        for (const translation of deletedTranslations) {
            await entityManager.delete(
                CourseTranslationEntity,
                {
                    courseId: translation.courseId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }

        // we save the new translations
        await entityManager.save(
            CourseTranslationEntity,
            createdTranslations,
        )

        // we update the updated translations
        for (const updatedTranslation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: updatedTranslation,
                    updated: updated.find(
                        (candidate) => courseTranslationKey(candidate) === courseTranslationKey(updatedTranslation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    /**
     * Update the course.
     * @param params - The parameters for updating the course.
     * @param params.previous - The previous course.
     * @param params.updated - The updated course.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateCourse(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<CourseEntity>,
    ) {
        // we update the course
        await entityManager.update(
            CourseEntity,
            {
                id: previous.id,
            },
            sanitizePrimitiveFields(updated),
        )

        // translations: nested children
        await this.updateTranslations(
            {
                previous: previous.translations,
                updated: updated.translations,
                entityManager,
            },
        )

        // pricing phases: nested children
        await this.pricingPhaseService.updatePricingPhases(
            {
                previous: previous.pricingPhases,
                updated: updated.pricingPhases,
                entityManager,
            },
        )
        // NOTE: pricing phases moved to PricingPhaseService

        await this.prerequisiteService.updatePrerequisites(
            {
                previous: previous.prerequisites,
                updated: updated.prerequisites,
                entityManager,
            },
        )

        // value propositions: nested children
        await this.valuePropositionService.updateValuePropositions(
            {
                previous: previous.valuePropositions,
                updated: updated.valuePropositions,
                entityManager,
            },
        )

        // qnas: nested children
        await this.qnaService.updateQnas(
            {
                previous: previous.qnas,
                updated: updated.qnas,
                entityManager,
            },
        )

        // modules: nested children
        await this.moduleService.updateModules(
            {
                previous: previous.modules,
                updated: updated.modules,
                entityManager,
            },
        )
    }

    /**
     * Update the courses.
     * @param params - The parameters for updating the courses.
     * @param params.previous - The previous courses.
     * @param params.updated - The updated courses.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateCourses(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<CourseEntity>>,
    ) {
        // we get the deleted courses
        const deletedCourses = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new courses
        const createdCourses = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated courses
        const updatedCourses = _.intersectionBy(
            previous,
            updated,
            "id",
        )
        // we delete the deleted courses
        await entityManager.delete(
            CourseEntity,
            {
                id: In(deletedCourses.map((deletedCourse) => deletedCourse.id)),
            },
        )

        // we save the new courses
        if (createdCourses.length) {
            await entityManager.save(
                CourseEntity,
                createdCourses,
            )
        }

        // we update the updated courses
        for (const updatedCourse of updatedCourses) {
            await this.updateCourse(
                {
                    previous: updatedCourse,
                    updated: updated.find((candidate) => candidate.id === updatedCourse.id)!,
                    entityManager,
                },
            )
        }
    }
}

