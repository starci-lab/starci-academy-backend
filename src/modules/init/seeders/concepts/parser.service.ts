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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ContextLoaderService,
} from "../shared/contexts/loader.service"
import {
    ExtractJsonFromMdService,
} from "../shared/extracts/extract-json-from-md.service"
import type {
    ResolvedFilePath,
} from "../shared/path/types"
import {
    ConceptIdFactoryService,
} from "./id-factories/concept.service"
import {
    ConceptSectionIdFactoryService,
} from "./id-factories/concept-section.service"
import {
    ConceptPathService,
} from "./path/concept.service"
import {
    ConceptSectionPathService,
} from "./path/concept-section.service"
import {
    ConceptMountInvalidException,
} from "@modules/platform/exceptions/errors/init/concept-mount-invalid"
import type {
    ConceptActivity,
    ConceptActivityKind,
    ConceptDifficulty,
    ConceptInvariantParams,
    ConceptLearningOutcome,
    LocalizedConceptMount,
    LocalizedConceptSectionMount,
    ConceptReference,
    ConceptSectionInvariantParams,
    ConceptSectionPhase,
    ConceptWorkspace,
    ParsedConceptMount,
    RawConceptMount,
    RawConceptSectionMount,
} from "./types"

const DIFFICULTIES = new Set<ConceptDifficulty>([
    "foundation",
    "intermediate",
    "advanced",
])

const PHASES = new Set<ConceptSectionPhase>([
    "challenge",
    "predict",
    "explore",
    "explain",
    "apply",
    "reflect",
])

const ACTIVITY_KINDS = new Set<ConceptActivityKind>([
    "choice",
    "exercise",
    "explain",
    "retrieval",
    "simulation",
])

@Injectable()
/** Parses the complete V1 concept mount into independent database rows. */
export class ConceptParserService {
    constructor(
        private readonly conceptPathService: ConceptPathService,
        private readonly conceptSectionPathService: ConceptSectionPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly conceptIdFactoryService: ConceptIdFactoryService,
        private readonly conceptSectionIdFactoryService: ConceptSectionIdFactoryService,
    ) {}

    /** Parse every concept before any caller begins persistence. */
    async parseMany(): Promise<Array<ParsedConceptMount>> {
        const paths = await this.conceptPathService.paths()
        const parsed: Array<ParsedConceptMount> = []
        for (const path of paths) {
            parsed.push({
                concept: await this.parseConcept(path),
                path,
            })
        }
        return parsed
    }

    private async parseConcept(
        path: ResolvedFilePath,
    ): Promise<DeepPartial<ConceptEntity>> {
        const displayId = this.requiredSlug(path.displayId,
            "concept")
        const localeMap = await this.loadLocaleMap<RawConceptMount>(
            path.relativePath,
        )
        const english = localeMap.get(Locale.En)!
        const conceptId = this.conceptIdFactoryService.generate(displayId)
        const sections = await this.parseSections(path,
            displayId,
            conceptId)
        const localized = new Map<Locale, ReturnType<ConceptParserService["localizedConcept"]>>()
        for (const locale of Object.values(Locale)) {
            localized.set(locale,
                this.localizedConcept(localeMap.get(locale)!,
                    `${displayId}/${locale}`))
        }
        const en = localized.get(Locale.En)!
        for (const locale of Object.values(Locale).filter((item) => item !== Locale.En)) {
            const value = localized.get(locale)!
            this.assertConceptInvariants({
                owner: `${displayId}/${locale}`,
                english,
                localized: localeMap.get(locale)!,
                englishCopy: en,
                localizedCopy: value,
                orderIndex: path.orderIndex,
            })
        }
        return {
            id: conceptId,
            displayId,
            title: en.title,
            description: en.description,
            category: this.requiredString(english.category,
                `${displayId}.category`),
            difficulty: this.difficulty(english.difficulty,
                displayId),
            minutesRead: this.nonNegativeInt(english.minutesRead,
                `${displayId}.minutesRead`),
            implementation: this.requiredString(english.implementation,
                `${displayId}.implementation`),
            orderIndex: path.orderIndex,
            sortIndex: this.sortIndex(english.sortIndex,
                path.orderIndex),
            body: en.body,
            learningOutcomes: en.learningOutcomes,
            prerequisites: en.prerequisites,
            references: en.references,
            workspace: this.workspace(english.workspace,
                `${displayId}.workspace`),
            activities: en.activities,
            translations: Object.values(Locale).map((locale) => {
                const value = localized.get(locale)!
                return {
                    conceptId,
                    locale,
                    ...value,
                } satisfies DeepPartial<ConceptTranslationEntity>
            }),
            sections,
        }
    }

    private async parseSections(
        conceptPath: ResolvedFilePath,
        conceptDisplayId: string,
        conceptId: string,
    ): Promise<Array<DeepPartial<ConceptSectionEntity>>> {
        const paths = await this.conceptSectionPathService.paths(
            conceptPath.relativePath,
        )
        const sections: Array<DeepPartial<ConceptSectionEntity>> = []
        for (const path of paths) {
            const displayId = this.requiredSlug(path.displayId,
                `${conceptDisplayId} section`)
            const sectionId = this.conceptSectionIdFactoryService.generate(
                conceptDisplayId,
                displayId,
            )
            const localeMap = await this.loadLocaleMap<RawConceptSectionMount>(
                path.relativePath,
            )
            const english = localeMap.get(Locale.En)!
            const localized = new Map<Locale, ReturnType<ConceptParserService["localizedSection"]>>()
            for (const locale of Object.values(Locale)) {
                localized.set(locale,
                    this.localizedSection(localeMap.get(locale)!,
                        `${conceptDisplayId}/${displayId}/${locale}`))
            }
            const en = localized.get(Locale.En)!
            for (const locale of Object.values(Locale).filter((item) => item !== Locale.En)) {
                this.assertSectionInvariants({
                    owner: `${conceptDisplayId}/${displayId}/${locale}`,
                    english,
                    localized: localeMap.get(locale)!,
                    englishCopy: en,
                    localizedCopy: localized.get(locale)!,
                    orderIndex: path.orderIndex,
                })
            }
            sections.push({
                id: sectionId,
                displayId,
                title: en.title,
                phase: this.phase(english.phase,
                    `${conceptDisplayId}/${displayId}`),
                body: en.body,
                orderIndex: path.orderIndex,
                sortIndex: this.sortIndex(english.sortIndex,
                    path.orderIndex),
                activities: en.activities,
                concept: {
                    id: conceptId,
                },
                translations: Object.values(Locale).map((locale) => {
                    const value = localized.get(locale)!
                    return {
                        conceptSectionId: sectionId,
                        locale,
                        ...value,
                    } satisfies DeepPartial<ConceptSectionTranslationEntity>
                }),
            })
        }
        return sections
    }

    private async loadLocaleMap<T extends Record<string, unknown>>(
        relativePath: string,
    ): Promise<Map<Locale, T>> {
        const result = new Map<Locale, T>()
        for (const locale of Object.values(Locale)) {
            const markdown = await this.contextLoaderService.load(
                "concepts",
                `${relativePath}/${locale}.md`,
            )
            result.set(locale,
                this.extractJsonFromMdService.extract<T>(markdown))
        }
        return result
    }

    private assertConceptInvariants({
        owner,
        english,
        localized,
        englishCopy,
        localizedCopy,
        orderIndex,
    }: ConceptInvariantParams): void {
        this.assertInvariant(owner,
            {
                category: this.requiredString(english.category,
                    `${owner}.category/en`),
                difficulty: this.difficulty(english.difficulty,
                    `${owner}/en`),
                minutesRead: this.nonNegativeInt(english.minutesRead,
                    `${owner}.minutesRead/en`),
                implementation: this.requiredString(english.implementation,
                    `${owner}.implementation/en`),
                sortIndex: this.sortIndex(english.sortIndex,
                    orderIndex),
                workspace: this.workspaceTopology(this.workspace(english.workspace,
                    `${owner}.workspace/en`)),
                learningOutcomeIds: this.ids(englishCopy.learningOutcomes),
                prerequisiteIds: this.ids(englishCopy.prerequisites),
                referenceIds: this.ids(englishCopy.references),
                activities: this.activityTopology(englishCopy.activities),
            },
            {
                category: this.requiredString(localized.category,
                    `${owner}.category`),
                difficulty: this.difficulty(localized.difficulty,
                    owner),
                minutesRead: this.nonNegativeInt(localized.minutesRead,
                    `${owner}.minutesRead`),
                implementation: this.requiredString(localized.implementation,
                    `${owner}.implementation`),
                sortIndex: this.sortIndex(localized.sortIndex,
                    orderIndex),
                workspace: this.workspaceTopology(this.workspace(localized.workspace,
                    `${owner}.workspace`)),
                learningOutcomeIds: this.ids(localizedCopy.learningOutcomes),
                prerequisiteIds: this.ids(localizedCopy.prerequisites),
                referenceIds: this.ids(localizedCopy.references),
                activities: this.activityTopology(localizedCopy.activities),
            })
    }

    private assertSectionInvariants({
        owner,
        english,
        localized,
        englishCopy,
        localizedCopy,
        orderIndex,
    }: ConceptSectionInvariantParams): void {
        this.assertInvariant(owner,
            {
                phase: this.phase(english.phase,
                    `${owner}/en`),
                sortIndex: this.sortIndex(english.sortIndex,
                    orderIndex),
                activities: this.activityTopology(englishCopy.activities),
            },
            {
                phase: this.phase(localized.phase,
                    owner),
                sortIndex: this.sortIndex(localized.sortIndex,
                    orderIndex),
                activities: this.activityTopology(localizedCopy.activities),
            })
    }

    private assertInvariant(owner: string, english: unknown, localized: unknown): void {
        if (JSON.stringify(english) !== JSON.stringify(localized)) {
            throw new ConceptMountInvalidException({
                owner,
                reason: "must preserve English metadata and structural IDs",
            })
        }
    }

    private ids(items: Array<{ id: string }> | null): Array<string> {
        return (items ?? []).map((item) => item.id)
    }

    private workspaceTopology(workspace: ConceptWorkspace | null): unknown {
        if (!workspace) {
            return null
        }
        return {
            runtime: workspace.runtime,
            files: workspace.files.map((file) => ({
                path: file.path,
                role: file.role,
            })),
            commands: workspace.commands ?? null,
        }
    }

    private activityTopology(activities: Array<ConceptActivity> | null): unknown {
        return (activities ?? []).map((activity) => ({
            id: activity.id,
            kind: activity.kind,
            stableKey: activity.stableKey ?? null,
            placementSortIndex: activity.placementSortIndex ?? null,
            responseKind: activity.responseKind ?? null,
            evaluationMethod: activity.evaluationMethod ?? null,
            isDiagnostic: activity.isDiagnostic ?? null,
            feedbackRelease: activity.feedbackRelease ?? null,
            outcomeIds: activity.outcomeIds ?? [],
            afterDays: activity.afterDays ?? null,
            options: (activity.options ?? []).map((option) => ({
                id: option.id,
                isCorrect: option.isCorrect ?? null,
            })),
            rubric: (activity.rubric ?? []).map((criterion) => ({
                id: criterion.id,
                maxScore: criterion.maxScore,
            })),
            simulation: activity.simulation
                ? {
                    engine: activity.simulation.engine,
                    initialStateId: activity.simulation.initialStateId,
                    states: activity.simulation.states.map((state) => ({
                        id: state.id,
                        isSuccess: state.isSuccess,
                    })),
                    actions: activity.simulation.actions.map((action) => action.id),
                    transitions: activity.simulation.transitions,
                }
                : null,
            exercise: activity.exercise
                ? {
                    verificationMode: activity.exercise.verificationMode,
                    files: (activity.exercise.files ?? []).map((file) => ({
                        relativePath: file.relativePath,
                        role: file.role,
                        syntaxLanguage: file.syntaxLanguage ?? null,
                    })),
                    checks: activity.exercise.checks ?? [],
                }
                : null,
        }))
    }

    private localizedConcept(
        raw: RawConceptMount,
        owner: string,
    ): LocalizedConceptMount {
        return {
            title: this.requiredString(raw.title,
                `${owner}.title`),
            description: this.requiredString(raw.description,
                `${owner}.description`),
            body: this.optionalString(raw.body),
            learningOutcomes: this.objectArray<ConceptLearningOutcome>(
                raw.learningOutcomes,
                `${owner}.learningOutcomes`,
                (item) => this.hasStrings(item,
                    ["id",
                        "text"]),
            ),
            prerequisites: this.objectArray<ConceptLearningOutcome>(
                raw.prerequisites,
                `${owner}.prerequisites`,
                (item) => this.hasStrings(item,
                    ["id",
                        "text"]),
            ),
            references: this.objectArray<ConceptReference>(
                raw.references,
                `${owner}.references`,
                (item) => this.hasStrings(item,
                    ["id",
                        "label"]),
            ),
            activities: this.activities(raw.activities,
                `${owner}.activities`),
        }
    }

    private localizedSection(
        raw: RawConceptSectionMount,
        owner: string,
    ): LocalizedConceptSectionMount {
        return {
            title: this.requiredString(raw.title,
                `${owner}.title`),
            body: this.requiredString(raw.body,
                `${owner}.body`),
            activities: this.activities(raw.activities,
                `${owner}.activities`),
        }
    }

    private activities(value: unknown, owner: string): Array<ConceptActivity> | null {
        return this.objectArray<ConceptActivity>(value,
            owner,
            (item) => this.activityValid(item))
    }

    private activityValid(item: Record<string, unknown>): boolean {
        if (!this.hasStrings(item,
            ["id",
                "kind",
                "prompt"])) {
            return false
        }
        if (!ACTIVITY_KINDS.has(item.kind as ConceptActivityKind)) {
            return false
        }
        if (item.options !== undefined && !this.arrayOfRecords(item.options,
            (option) => this.hasStrings(option,
                ["id",
                    "label"]))) {
            return false
        }
        if (item.answer !== undefined && !this.recordMatches(item.answer,
            (answer) => this.hasStrings(answer,
                ["explanation"]))) {
            return false
        }
        if (item.hints !== undefined && !this.arrayOfStrings(item.hints)) {
            return false
        }
        if (item.outcomeIds !== undefined && !this.arrayOfStrings(item.outcomeIds)) {
            return false
        }
        if (item.rubric !== undefined && !this.arrayOfRecords(item.rubric,
            (criterion) => this.rubricValid(criterion))) {
            return false
        }
        if (item.kind === "simulation" && !this.recordMatches(item.simulation,
            (simulation) => this.simulationValid(simulation))) {
            return false
        }
        return item.kind !== "exercise" || this.recordMatches(item.exercise,
            (exercise) => this.exerciseValid(exercise))
    }

    private rubricValid(item: Record<string, unknown>): boolean {
        return this.hasStrings(item,
            ["id",
                "criterion",
                "expectedEvidence"])
            && typeof item.maxScore === "number"
            && Number.isFinite(item.maxScore)
    }

    private simulationValid(item: Record<string, unknown>): boolean {
        return this.hasStrings(item,
            ["engine",
                "initialStateId"])
            && this.arrayOfRecords(item.states,
                (state) => this.hasStrings(state,
                    ["id",
                        "label",
                        "observation"])
                    && typeof state.isSuccess === "boolean")
            && this.arrayOfRecords(item.actions,
                (action) => this.hasStrings(action,
                    ["id",
                        "label"]))
            && this.arrayOfRecords(item.transitions,
                (transition) => this.hasStrings(transition,
                    ["id",
                        "fromStateId",
                        "actionId",
                        "toStateId"]))
    }

    private exerciseValid(item: Record<string, unknown>): boolean {
        return this.hasStrings(item,
            ["submissionInstructions",
                "verificationMode",
                "verificationInstructions"])
            && (item.files === undefined || this.arrayOfRecords(item.files,
                (file) => this.hasStrings(file,
                    ["relativePath",
                        "role",
                        "content",
                        "sha256"])))
            && (item.checks === undefined || this.arrayOfRecords(item.checks,
                (check) => this.hasStrings(check,
                    ["runner",
                        "entrypoint"])
                    && typeof check.expectedExitCode === "number"))
    }

    private workspace(value: unknown, owner: string): ConceptWorkspace | null {
        const parsed = this.json(value,
            owner)
        if (parsed === null) {
            return null
        }
        if (!this.recordMatches(parsed,
            (workspace) => this.hasStrings(workspace,
                ["runtime"])
                && this.arrayOfRecords(workspace.files,
                    (file) => this.workspaceFileValid(file)))) {
            throw new ConceptMountInvalidException({
                owner,
                reason: "must be a valid workspace object",
            })
        }
        return parsed as ConceptWorkspace
    }

    private workspaceFileValid(file: Record<string, unknown>): boolean {
        if (!this.hasStrings(file,
            ["path",
                "role"])) {
            return false
        }
        const path = file.path as string
        const role = file.role as string
        return ["source",
            "test",
            "support"].includes(role)
            && !path.includes("\\")
            && !path.startsWith("/")
            && !path.split("/").includes("..")
    }

    private difficulty(value: unknown, owner: string): ConceptDifficulty {
        const difficulty = this.requiredString(value,
            `${owner}.difficulty`) as ConceptDifficulty
        if (!DIFFICULTIES.has(difficulty)) {
            throw new ConceptMountInvalidException({
                owner: `${owner}.difficulty`,
                reason: "is unsupported",
            })
        }
        return difficulty
    }

    private phase(value: unknown, owner: string): ConceptSectionPhase {
        const phase = this.requiredString(value,
            `${owner}.phase`) as ConceptSectionPhase
        if (!PHASES.has(phase)) {
            throw new ConceptMountInvalidException({
                owner: `${owner}.phase`,
                reason: "is unsupported",
            })
        }
        return phase
    }

    private objectArray<T>(
        value: unknown,
        owner: string,
        validator: (item: Record<string, unknown>) => boolean,
    ): Array<T> | null {
        const parsed = this.json(value,
            owner)
        if (parsed === null) {
            return null
        }
        if (!this.arrayOfRecords(parsed,
            validator)) {
            throw new ConceptMountInvalidException({
                owner,
                reason: "must be a valid JSON array",
            })
        }
        return parsed as Array<T>
    }

    private json(value: unknown, owner: string): unknown | null {
        if (value === undefined || value === null || value === "") {
            return null
        }
        if (typeof value !== "string") {
            return value
        }
        try {
            return JSON.parse(value)
        } catch {
            throw new ConceptMountInvalidException({
                owner,
                reason: "must contain valid JSON",
            })
        }
    }

    private recordMatches(
        value: unknown,
        validator: (item: Record<string, unknown>) => boolean,
    ): boolean {
        return this.isRecord(value) && validator(value)
    }

    private arrayOfRecords(
        value: unknown,
        validator: (item: Record<string, unknown>) => boolean,
    ): boolean {
        return Array.isArray(value)
            && value.every((item) => this.isRecord(item) && validator(item))
    }

    private arrayOfStrings(value: unknown): boolean {
        return Array.isArray(value)
            && value.every((item) => typeof item === "string")
    }

    private hasStrings(item: Record<string, unknown>, fields: Array<string>): boolean {
        return fields.every((field) => typeof item[field] === "string"
            && (item[field] as string).trim().length > 0)
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null && !Array.isArray(value)
    }

    private requiredString(value: unknown, owner: string): string {
        if (typeof value !== "string" || value.trim().length === 0) {
            throw new ConceptMountInvalidException({
                owner,
                reason: "is required",
            })
        }
        return value.trim()
    }

    private optionalString(value: unknown): string | null {
        return typeof value === "string" && value.trim().length > 0
            ? value.trim()
            : null
    }

    private nonNegativeInt(value: unknown, owner: string): number {
        const parsed = Number.parseInt(String(value ?? ""),
            10)
        if (!Number.isInteger(parsed) || parsed < 0) {
            throw new ConceptMountInvalidException({
                owner,
                reason: "must be a non-negative integer",
            })
        }
        return parsed
    }

    private sortIndex(value: unknown, orderIndex: number): number {
        const parsed = Number.parseInt(String(value ?? ""),
            10)
        return Number.isInteger(parsed) ? parsed : orderIndex + 1
    }

    private requiredSlug(value: string, owner: string): string {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) {
            throw new ConceptMountInvalidException({
                owner,
                reason: "folder requires a non-empty kebab-case slug",
            })
        }
        return value
    }
}
