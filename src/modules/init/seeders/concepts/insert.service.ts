import {
    Injectable,
} from "@nestjs/common"
import type {
    DeepPartial,
} from "typeorm"
import {
    ConceptEntity,
} from "@modules/databases/postgresql/primary/entities/concept.entity"
import {
    ConceptSectionEntity,
} from "@modules/databases/postgresql/primary/entities/concept-section.entity"
import {
    ConceptSectionTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/concept-section-translation.entity"
import {
    ConceptTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/concept-translation.entity"
import {
    UpsertService,
} from "../shared/upsert/upsert.service"

@Injectable()
/** Persists one completely parsed concept snapshot with parent-scoped pruning. */
export class ConceptInsertService {
    constructor(
        private readonly upsertService: UpsertService,
    ) {}

    /** Synchronize the complete nonempty Concepts domain. */
    async insertAll(concepts: Array<DeepPartial<ConceptEntity>>): Promise<void> {
        if (concepts.length === 0) {
            return
        }
        await this.upsertService.transaction(async (upsertService) => {
            await this.insertSnapshot(upsertService,
                concepts)
        })
    }

    private async insertSnapshot(
        upsertService: UpsertService,
        concepts: Array<DeepPartial<ConceptEntity>>,
    ): Promise<void> {
        const roots = concepts.map((concept) => this.conceptRow(concept))
        await upsertService.upsertMany(ConceptEntity,
            roots,
            {
            })

        for (const concept of concepts) {
            await this.insertConceptChildren(upsertService,
                concept)
        }
    }

    private async insertConceptChildren(
        upsertService: UpsertService,
        concept: DeepPartial<ConceptEntity>,
    ): Promise<void> {
        const conceptId = concept.id as string
        await upsertService.upsertTranslationMany(
            ConceptTranslationEntity,
            concept.translations ?? [],
            {
                conceptId,
            },
        )

        const sections = concept.sections ?? []
        const sectionRows = sections.map((section) => this.sectionRow(section))
        await upsertService.upsertMany(
            ConceptSectionEntity,
            sectionRows,
            {
                concept: {
                    id: conceptId,
                },
            },
        )
        for (const section of sections) {
            await upsertService.upsertTranslationMany(
                ConceptSectionTranslationEntity,
                section.translations ?? [],
                {
                    conceptSectionId: section.id as string,
                },
            )
        }
    }

    private conceptRow(concept: DeepPartial<ConceptEntity>): DeepPartial<ConceptEntity> {
        return {
            id: concept.id,
            displayId: concept.displayId,
            title: concept.title,
            description: concept.description,
            category: concept.category,
            difficulty: concept.difficulty,
            minutesRead: concept.minutesRead,
            implementation: concept.implementation,
            orderIndex: concept.orderIndex,
            sortIndex: concept.sortIndex,
            body: concept.body,
            learningOutcomes: concept.learningOutcomes,
            prerequisites: concept.prerequisites,
            references: concept.references,
            workspace: concept.workspace,
            activities: concept.activities,
        }
    }

    private sectionRow(
        section: DeepPartial<ConceptSectionEntity>,
    ): DeepPartial<ConceptSectionEntity> {
        return {
            id: section.id,
            displayId: section.displayId,
            title: section.title,
            phase: section.phase,
            body: section.body,
            orderIndex: section.orderIndex,
            sortIndex: section.sortIndex,
            activities: section.activities,
            concept: section.concept,
        }
    }
}
