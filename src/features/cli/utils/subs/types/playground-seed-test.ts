/**
 * Row-count snapshot for the playground seed test — one field per table touched
 * by {@link import("../playground-seed-test.command").PlaygroundSeedTestCommand}.
 */
export interface PlaygroundSeedTestRowCounts {
    /**
     * Row count of the `playgrounds` table (scoped to the devops-mastery course).
     */
    playgrounds: number
    /**
     * Row count of the `playground_steps` table (scoped to the devops-mastery course).
     */
    playgroundSteps: number
    /**
     * Row count of the `playground_translations` table (scoped to the devops-mastery course).
     */
    playgroundTranslations: number
    /**
     * Row count of the `playground_step_translations` table (scoped to the devops-mastery course).
     */
    playgroundStepTranslations: number
}
