/** One seed step definition for {@link PlaygroundSeedDefinition}. */
export interface PlaygroundSeedStepDefinition {
    /** Step title. */
    title: string
    /** Step instructions body (markdown). */
    body: string
    /** Sample command shown to the student. */
    commandHint: string
    /** Resource kind matched against the agent's self-reported resource list. */
    verifyResourceKind: string
    /** Substring/prefix matched against the reported resource name (empty = any name). */
    verifyResourceNamePattern: string
    /** Expected reported status; null = existence check only. */
    verifyExpectedStatus: string | null
}

/** One seed playground definition for the `playground-seed` CLI command. */
export interface PlaygroundSeedDefinition {
    /** URL-facing stable identifier. */
    slug: string
    /** Playground title. */
    title: string
    /** Short description of what the playground covers. */
    description: string
    /** Icon shown next to the playground title (emoji). */
    icon: string
    /** Ordered steps. */
    steps: Array<PlaygroundSeedStepDefinition>
}
