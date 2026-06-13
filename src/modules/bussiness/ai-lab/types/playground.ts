import type {
    AiLabPlaygroundEntity,
    AiLabRunEntity,
    Locale,
} from "@modules/databases"

/** Params for {@link AiLabPlaygroundService.getPlaygroundForLesson}. */
export interface GetPlaygroundForLessonParams {
    /** Lesson content id the playground is attached to. */
    contentId: string
    /** Locale to resolve the playground's localized label / description into. */
    locale: Locale
}

/** Result of {@link AiLabPlaygroundService.getPlaygroundForLesson}. */
export interface GetPlaygroundForLessonResult {
    /** The localized playground config, or null when the lesson has none. */
    playground: AiLabPlaygroundEntity | null
}

/** Params for {@link AiLabPlaygroundService.listMyRuns}. */
export interface ListMyRunsParams {
    /** Owner whose runs are listed. */
    userId: string
    /** Playground to scope the runs to. */
    playgroundId: string
}

/** Result of {@link AiLabPlaygroundService.listMyRuns}. */
export interface ListMyRunsResult {
    /** The user's runs in this playground, newest first. */
    runs: Array<AiLabRunEntity>
}
