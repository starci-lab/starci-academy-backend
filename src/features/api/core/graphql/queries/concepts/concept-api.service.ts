import {
    Injectable,
} from "@nestjs/common"
import type {
    FindOptionsWhere,
} from "typeorm"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ConceptEntity,
} from "@modules/databases/postgresql/primary/entities/concept.entity"
import type {
    ConceptSectionEntity,
} from "@modules/databases/postgresql/primary/entities/concept-section.entity"
import type {
    ConceptActivity,
    ConceptWorkspace,
} from "@modules/init/seeders/concepts/types"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ConceptWorkspaceSourceService,
} from "./concept-workspace-source.service"
import type {
    ConceptRequest,
    ConceptsRequest,
} from "./graphql-types/request"
import type {
    ConceptActivityData,
    ConceptDetailData,
    ConceptListItemData,
    ConceptSectionData,
    ConceptWorkspaceData,
} from "./graphql-types/response"

@Injectable()
/** Builds localized, learner-safe projections from independent Concept rows. */
export class ConceptApiService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly workspaceSourceService: ConceptWorkspaceSourceService,
    ) {}

    /** List lightweight localized concept cards in authored order. */
    async list(
        request: ConceptsRequest | undefined,
        locale: Locale,
    ): Promise<Array<ConceptListItemData>> {
        const where: FindOptionsWhere<ConceptEntity> = {
        }
        if (request?.category) {
            where.category = request.category
        }
        if (request?.difficulty) {
            where.difficulty = request.difficulty
        }
        const concepts = await this.entityManager.find(ConceptEntity,
            {
                where,
                relations: {
                    translations: true,
                },
                order: {
                    sortIndex: "ASC",
                    orderIndex: "ASC",
                },
            })
        return concepts.map((concept) => this.summary(concept,
            locale))
    }

    /** Resolve one localized concept detail, returning null for an unknown slug. */
    async detail(
        request: ConceptRequest,
        locale: Locale,
    ): Promise<ConceptDetailData | null> {
        if (!request.displayId?.trim()) {
            return null
        }
        const concept = await this.entityManager.findOne(ConceptEntity,
            {
                where: {
                    displayId: request.displayId,
                },
                relations: {
                    translations: true,
                    sections: {
                        translations: true,
                    },
                },
            })
        if (!concept) {
            return null
        }
        const localized = concept.translations?.find((item) => item.locale === locale)
            ?? concept.translations?.find((item) => item.locale === Locale.En)
        const workspace = await this.workspace(concept,
            concept.workspace)
        const sections = [...(concept.sections ?? [])]
            .sort((left, right) => left.sortIndex - right.sortIndex
                || left.orderIndex - right.orderIndex)
            .map((section) => this.section(section,
                locale))
        return {
            ...this.summary(concept,
                locale),
            body: localized?.body ?? concept.body,
            learningOutcomes: localized?.learningOutcomes
                ?? concept.learningOutcomes
                ?? [],
            prerequisites: localized?.prerequisites
                ?? concept.prerequisites
                ?? [],
            references: (localized?.references ?? concept.references ?? []).map((reference) => ({
                ...reference,
                url: reference.url ?? null,
                citation: reference.citation ?? null,
            })),
            workspace,
            activities: this.activities(localized?.activities ?? concept.activities),
            sections,
            capabilities: {
                choiceSubmission: false,
                writtenResponseGrading: false,
                simulationExecution: false,
            },
        }
    }

    private summary(concept: ConceptEntity, locale: Locale): ConceptListItemData {
        const localized = concept.translations?.find((item) => item.locale === locale)
            ?? concept.translations?.find((item) => item.locale === Locale.En)
        return {
            displayId: concept.displayId,
            title: localized?.title ?? concept.title,
            description: localized?.description ?? concept.description,
            category: concept.category,
            difficulty: concept.difficulty,
            minutesRead: concept.minutesRead,
            implementation: concept.implementation,
            sortIndex: concept.sortIndex,
        }
    }

    private section(section: ConceptSectionEntity, locale: Locale): ConceptSectionData {
        const localized = section.translations?.find((item) => item.locale === locale)
            ?? section.translations?.find((item) => item.locale === Locale.En)
        return {
            displayId: section.displayId,
            title: localized?.title ?? section.title,
            phase: section.phase,
            body: localized?.body ?? section.body,
            sortIndex: section.sortIndex,
            activities: this.activities(localized?.activities ?? section.activities),
        }
    }

    private activities(
        activities: Array<ConceptActivity> | null | undefined,
    ): Array<ConceptActivityData> {
        return (activities ?? []).map((activity) => ({
            id: activity.id,
            kind: activity.kind,
            stableKey: activity.stableKey ?? null,
            prompt: activity.prompt,
            responseKind: activity.responseKind ?? null,
            isDiagnostic: activity.isDiagnostic ?? null,
            outcomeIds: activity.outcomeIds ?? [],
            afterDays: activity.afterDays ?? null,
            options: (activity.options ?? []).map((option) => ({
                id: option.id,
                label: option.label,
            })),
            exercise: activity.exercise
                ? {
                    submissionInstructions: activity.exercise.submissionInstructions,
                    verificationMode: activity.exercise.verificationMode,
                    verificationInstructions: activity.exercise.verificationInstructions,
                }
                : null,
        }))
    }

    private async workspace(
        concept: ConceptEntity,
        workspace: ConceptWorkspace | null,
    ): Promise<ConceptWorkspaceData | null> {
        if (!workspace) {
            return null
        }
        const files = workspace.files.filter((file) => ["source",
            "support",
            "test"].includes(file.role))
        return {
            runtime: workspace.runtime,
            commands: workspace.commands
                ? {
                    windows: workspace.commands.windows ?? null,
                    unix: workspace.commands.unix ?? null,
                }
                : null,
            files: await Promise.all(files.map(async (file) => ({
                path: file.path,
                role: file.role,
                content: await this.workspaceSourceService.read(concept,
                    file),
            }))),
        }
    }
}
