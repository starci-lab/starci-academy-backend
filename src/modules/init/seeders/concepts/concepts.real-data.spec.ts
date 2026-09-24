import crypto from "node:crypto"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import path from "node:path"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ExtractJsonFromMdService,
} from "../shared/extracts/extract-json-from-md.service"
import {
    ConceptIdFactoryService,
} from "./id-factories/concept.service"
import {
    ConceptSectionIdFactoryService,
} from "./id-factories/concept-section.service"
import {
    ConceptParserService,
} from "./parser.service"
import type {
    ConceptActivity,
    ConceptWorkspace,
} from "./types"

const configuredDataRoot = process.env.STARCI_CONCEPTS_DATA_ROOT
const dataRoot = path.resolve(configuredDataRoot
    ?? path.join(process.cwd(),
        "..",
        "concepts-v1-data"))
const conceptsRoot = path.join(dataRoot,
    "concepts")
const realDataAvailable = fs.existsSync(conceptsRoot)
const describeRealData = realDataAvailable ? describe : describe.skip

interface ActivityCounts {
    kinds: Record<string, number>
    answers: number
    options: number
    hints: number
    rubric: number
    simulationStates: number
    simulationActions: number
    simulationTransitions: number
    exerciseFiles: number
    exerciseChecks: number
}

const emptyCounts = (): ActivityCounts => ({
    kinds: {
    },
    answers: 0,
    options: 0,
    hints: 0,
    rubric: 0,
    simulationStates: 0,
    simulationActions: 0,
    simulationTransitions: 0,
    exerciseFiles: 0,
    exerciseChecks: 0,
})

const addActivities = (
    counts: ActivityCounts,
    activities: Array<ConceptActivity> | null | undefined,
): void => {
    for (const activity of activities ?? []) {
        counts.kinds[activity.kind] = (counts.kinds[activity.kind] ?? 0) + 1
        counts.answers += activity.answer ? 1 : 0
        counts.options += activity.options?.length ?? 0
        counts.hints += activity.hints?.length ?? 0
        counts.rubric += activity.rubric?.length ?? 0
        counts.simulationStates += activity.simulation?.states.length ?? 0
        counts.simulationActions += activity.simulation?.actions.length ?? 0
        counts.simulationTransitions += activity.simulation?.transitions.length ?? 0
        counts.exerciseFiles += activity.exercise?.files?.length ?? 0
        counts.exerciseChecks += activity.exercise?.checks?.length ?? 0

        if (activity.simulation) {
            const stateIds = new Set(activity.simulation.states.map((state) => state.id))
            const actionIds = new Set(activity.simulation.actions.map((action) => action.id))
            expect(stateIds.has(activity.simulation.initialStateId)).toBe(true)
            expect(activity.simulation.states.some((state) => state.isSuccess)).toBe(true)
            for (const transition of activity.simulation.transitions) {
                expect(stateIds.has(transition.fromStateId)).toBe(true)
                expect(stateIds.has(transition.toStateId)).toBe(true)
                expect(actionIds.has(transition.actionId)).toBe(true)
            }
        }
        for (const file of activity.exercise?.files ?? []) {
            expect(crypto.createHash("sha256")
                .update(file.content)
                .digest("hex"))
                .toBe(file.sha256)
        }
    }
}

const indexedPaths = async (root: string, relativePath: string): Promise<Array<{
    relativePath: string
    orderIndex: number
    displayId: string
}>> => {
    const entries = await fsPromises.readdir(
        path.join(root,
            relativePath),
        {
            withFileTypes: true,
        },
    )
    return entries
        .filter((entry) => entry.isDirectory() && /^\d+-[a-z0-9-]+$/u.test(entry.name))
        .map((entry) => {
            const [index,
                ...slug] = entry.name.split("-")
            return {
                relativePath: path.posix.join(relativePath,
                    entry.name),
                orderIndex: Number.parseInt(index,
                    10),
                displayId: slug.join("-"),
            }
        })
        .sort((left, right) => left.orderIndex - right.orderIndex)
}

describeRealData("Concepts V1 real data mount",
    () => {
        it("parses the complete bilingual corpus without losing authored structures",
            async () => {
                const conceptIds = new ConceptIdFactoryService()
                const parser = new ConceptParserService(
                    {
                        paths: async () => indexedPaths(conceptsRoot,
                            ""),
                    } as never,
                    {
                        paths: async (conceptRelativePath: string) => indexedPaths(
                            conceptsRoot,
                            path.posix.join(conceptRelativePath,
                                "sections"),
                        ),
                    } as never,
                    {
                        load: async (base: string, relativePath: string) => fsPromises.readFile(
                            path.join(dataRoot,
                                base,
                                relativePath),
                            "utf8",
                        ),
                    } as never,
                    new ExtractJsonFromMdService(),
                    conceptIds,
                    new ConceptSectionIdFactoryService(conceptIds),
                )

                const parsed = await parser.parseMany()
                expect(parsed).toHaveLength(7)
                expect(parsed.flatMap((item) => item.concept.sections ?? []))
                    .toHaveLength(75)

                const counts = {
                    [Locale.En]: emptyCounts(),
                    [Locale.Vi]: emptyCounts(),
                }
                const documentText = {
                    [Locale.En]: "",
                    [Locale.Vi]: "",
                }
                let outcomes = 0
                let prerequisites = 0
                let references = 0
                let workspaceFiles = 0
                const conceptUuid = new Set<string>()
                const sectionUuid = new Set<string>()

                for (const { concept } of parsed) {
                    const workspace = concept.workspace as ConceptWorkspace | null | undefined
                    conceptUuid.add(concept.id as string)
                    outcomes += concept.learningOutcomes?.length ?? 0
                    prerequisites += concept.prerequisites?.length ?? 0
                    references += concept.references?.length ?? 0
                    workspaceFiles += workspace?.files.length ?? 0
                    addActivities(counts[Locale.En],
                        concept.activities as Array<ConceptActivity> | null | undefined)
                    documentText[Locale.En] += concept.body ?? ""

                    const vi = concept.translations?.find(
                        (translation) => translation.locale === Locale.Vi,
                    )
                    expect(vi).toBeDefined()
                    addActivities(counts[Locale.Vi],
                        vi?.activities as Array<ConceptActivity> | null | undefined)
                    documentText[Locale.Vi] += vi?.body ?? ""

                    for (const section of concept.sections ?? []) {
                        sectionUuid.add(section.id as string)
                        addActivities(counts[Locale.En],
                            section.activities as Array<ConceptActivity> | null | undefined)
                        documentText[Locale.En] += section.body ?? ""
                        const viSection = section.translations?.find(
                            (translation) => translation.locale === Locale.Vi,
                        )
                        expect(viSection).toBeDefined()
                        addActivities(counts[Locale.Vi],
                            viSection?.activities as Array<ConceptActivity> | null | undefined)
                        documentText[Locale.Vi] += viSection?.body ?? ""
                    }
                }

                expect(conceptUuid.size).toBe(7)
                expect(sectionUuid.size).toBe(75)
                expect(outcomes).toBe(21)
                expect(prerequisites).toBe(15)
                expect(references).toBe(21)
                expect(workspaceFiles).toBe(10)
                for (const locale of Object.values(Locale)) {
                    expect(counts[locale]).toEqual({
                        kinds: {
                            choice: 21,
                            exercise: 14,
                            explain: 14,
                            retrieval: 21,
                            simulation: 7,
                        },
                        answers: 70,
                        options: 63,
                        hints: 49,
                        rubric: 105,
                        simulationStates: 33,
                        simulationActions: 26,
                        simulationTransitions: 26,
                        exerciseFiles: 10,
                        exerciseChecks: 5,
                    })
                    expect(documentText[locale].match(/```mermaid/gu)).toHaveLength(7)
                    expect(documentText[locale].match(/```/gu)).toHaveLength(50)
                }

                for (const { concept } of parsed) {
                    const workspace = concept.workspace as ConceptWorkspace | null | undefined
                    for (const file of workspace?.files ?? []) {
                        const absolute = path.join(conceptsRoot,
                            `${concept.orderIndex as number}-${concept.displayId as string}`,
                            file.path)
                        expect(fs.existsSync(absolute)).toBe(true)
                        expect(fs.statSync(absolute).size).toBeGreaterThan(0)
                    }
                }
            })
    })
