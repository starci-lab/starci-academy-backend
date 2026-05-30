import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    CodeExplainingEntity,
    CodeExplainingTranslationEntity,
    CodeImplementationEntity,
    CodeImplementationTranslationEntity,
    ContentBodyEntity,
    ContentBodyTranslationEntity,
    ContentEntity,
    ContentReferenceEntity,
    ContentReferenceTranslationEntity,
    ContentTranslationEntity,
} from "@modules/databases"
import {
    UpsertService,
} from "./upsert.service"
import {
    upsertChildrenWithTranslations,
} from "./challenge-insert.service"
import {
    deleteFields,
} from "../utils"

/**
 * Inserts/updates/deletes content-level tables:
 * contents, translations, references, code_explainings, code_implementations.
 */
@Injectable()
export class ContentInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) { }

    /**
     * Upsert a single content and its direct child tables.
     */
    async insert(
        content: DeepPartial<ContentEntity>,
    ): Promise<void> {
        const contentId = content.id as string
        const translations = content.translations
        const references = content.references
        const codeExplainings = content.codeExplainings
        const codeImplementations = content.codeImplementations
        const bodies = content.bodies
        const moduleRef = content.module

        const contentRow = deleteFields(
            content,
            [
                "translations",
                "references",
                "codeExplainings",
                "codeImplementations",
                "bodies",
                "module",
                "challenges",
                "lessons",
            ],
        )

        await this.upsertService.upsertUuid(
            ContentEntity,
            [{
                ...contentRow,
                ...(moduleRef ? {
                    module: moduleRef,
                } : {
                }),
            }],
        )

        if (translations) {
            await this.upsertService.upsertTranslation(
                ContentTranslationEntity,
                translations,
                {
                    contentId,
                },
            )
        }

        if (references) {
            for (const reference of references) {
                const {
                    translations: referenceTranslations,
                    ...referenceData
                } = reference
                await this.upsertService.upsertUuid(
                    ContentReferenceEntity,
                    [referenceData],
                )
                if (referenceTranslations?.length) {
                    await this.upsertService.upsertTranslation<ContentReferenceTranslationEntity>(
                        ContentReferenceTranslationEntity,
                        referenceTranslations,
                        {
                            contentReferenceId: reference.id,
                        },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<ContentReferenceEntity>(
                ContentReferenceEntity,
                references.map((reference) => reference.id ?? ""),
                {
                    content: {
                        id: contentId,
                    },
                },
            )
        }

        if (codeExplainings !== undefined) {
            for (const explaining of codeExplainings) {
                const {
                    translations: explainingTranslations,
                    ...explainingData
                } = explaining
                await this.upsertService.upsertUuid(
                    CodeExplainingEntity,
                    [explainingData],
                )
                if (explainingTranslations?.length) {
                    await this.upsertService.upsertTranslation<CodeExplainingTranslationEntity>(
                        CodeExplainingTranslationEntity,
                        explainingTranslations,
                        {
                            codeExplainingId: explaining.id as string,
                        },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<CodeExplainingEntity>(
                CodeExplainingEntity,
                codeExplainings.map((row) => row.id ?? ""),
                {
                    content: {
                        id: contentId,
                    },
                },
            )
        }

        if (codeImplementations !== undefined) {
            for (const implementation of codeImplementations) {
                const {
                    translations: implementationTranslations,
                    ...implementationData
                } = implementation
                await this.upsertService.upsertUuid(
                    CodeImplementationEntity,
                    [implementationData],
                )
                if (implementationTranslations?.length) {
                    await this.upsertService.upsertTranslation<CodeImplementationTranslationEntity>(
                        CodeImplementationTranslationEntity,
                        implementationTranslations,
                        {
                            codeImplementationId: implementation.id as string,
                        },
                    )
                }
            }
            await this.upsertService.deleteStaleUuid<CodeImplementationEntity>(
                CodeImplementationEntity,
                codeImplementations.map((row) => row.id ?? ""),
                {
                    content: {
                        id: contentId,
                    },
                },
            )
        }

        // SCHEMA V2 per-language lesson bodies (mount `# bodies`) + their per-locale translations,
        // scoped + stale-deleted per content (the helper drops removed buckets too).
        await upsertChildrenWithTranslations(
            this.upsertService,
            ContentBodyEntity,
            ContentBodyTranslationEntity,
            bodies as Array<DeepPartial<ContentBodyEntity>> | undefined,
            {
                content: {
                    id: contentId,
                },
            },
            "contentBodyId",
        )
    }

    /**
     * Delete stale contents for a module.
     */
    async deleteStale(
        ids: Array<string>,
        moduleId: string,
    ): Promise<void> {
        await this.upsertService.deleteStaleUuid<ContentEntity>(
            ContentEntity,
            ids,
            {
                module: {
                    id: moduleId,
                },
            },
        )
    }
}
