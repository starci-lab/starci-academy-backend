import {
    ModuleEntity,
    ModuleTranslationEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import type {
    UpdateParams,
} from "./types"
import {
    moduleTranslationKey,
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"
import {
    ContentService,
} from "./content.service"
import {
    LessonVideoService,
} from "./lesson-video.service"
import {
    ChallengeService,
} from "./challenge.service"
import {
    PreviewContentService,
} from "./preview-content.service"

/**
 * The service for Modules (and their nested children).
 */
@Injectable()
export class ModuleService {
    constructor(
        private readonly contentService: ContentService,
        private readonly previewContentService: PreviewContentService,
        private readonly lessonVideoService: LessonVideoService,
        private readonly challengeService: ChallengeService,
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
        }: UpdateParams<ModuleTranslationEntity>
    ) {
        // we update the translation
        await entityManager.update(
            ModuleTranslationEntity,
            {
                moduleId: previous.moduleId,
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
        }: UpdateParams<Array<ModuleTranslationEntity>>
    ) {
        const deletedTranslations = _.differenceBy(
            previous,
            updated,
            moduleTranslationKey,
        )
        const newTranslations = _.differenceBy(
            updated,
            previous,
            moduleTranslationKey,
        )
        const updatedTranslations = _.intersectionBy(
            previous,
            updated,
            moduleTranslationKey,
        )
        for (const translation of deletedTranslations) {
            await entityManager.delete(
                ModuleTranslationEntity,
                {
                    moduleId: translation.moduleId,
                    locale: translation.locale,
                    field: translation.field,
                },
            )
        }
        // we save the new translations
        await entityManager.save(
            ModuleTranslationEntity,
            newTranslations,
        )

        for (const translation of updatedTranslations) {
            await this.updateTranslation(
                {
                    previous: translation,
                    updated: updated.find(
                        (candidate) => moduleTranslationKey(candidate) === moduleTranslationKey(translation),
                    )!,
                    entityManager,
                },
            )
        }
    }

    /**
     * Update the module.
     * @param params - The parameters for updating the module.
     * @param params.previous - The previous module.
     * @param params.updated - The updated module.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateModule(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ModuleEntity>,
    ) {
        // we update the module
        await entityManager.update(
            ModuleEntity,
            {
                id: previous.id,
            },
            sanitizePrimitiveFields(updated),
        )
        // we update the translations
        await this.updateTranslations(
            {
                previous: previous.translations,
                updated: updated.translations,
                entityManager,
            },
        )

        // nested children
        await this.contentService.updateContents(
            {
                previous: previous.contents,
                updated: updated.contents,
                entityManager,
            },
        )
        await this.previewContentService.updatePreviewContents(
            {
                previous: previous.previewContents,
                updated: updated.previewContents,
                entityManager,
            },
        )
        await this.lessonVideoService.updateLessonVideos(
            {
                previous: previous.lessonVideos,
                updated: updated.lessonVideos,
                entityManager,
            },
        )
        await this.challengeService.updateChallenges(
            {
                previous: previous.challenges ?? [],
                updated: updated.challenges ?? [],
                entityManager,
            },
        )
    }

    /**
     * Update the modules.
     * @param params - The parameters for updating the modules.
     * @param params.previous - The previous modules.
     * @param params.updated - The updated modules.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updateModules(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ModuleEntity>>,
    ) {
        // we get the deleted modules
        const deletedModules = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new modules
        const createdModules = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated modules
        const updatedModules = _.intersectionBy(
            previous,
            updated,
            "id",
        )

        // we delete the deleted modules
        await entityManager.delete(
            ModuleEntity,
            {
                id: In(deletedModules.map((deletedModule) => deletedModule.id)),
            },
        )

        // we save the new modules
        await entityManager.save(
            ModuleEntity,
            createdModules,
        )

        // we update the updated modules
        for (const updatedModule of updatedModules) {
            await this.updateModule(
                {
                    previous: updatedModule,
                    updated: updated.find((candidate) => candidate.id === updatedModule.id)!,
                    entityManager,
                },
            )
        }
    }
}

