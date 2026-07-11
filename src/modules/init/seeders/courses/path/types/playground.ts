/**
 * Params for resolving playground directories under `courses/{course}/playgrounds/`.
 */
export interface PlaygroundPathsParams {
    /** Course folder path segment under `courses/`. */
    courseRelativePath: string
}

/**
 * Params for resolving step directories under `playgrounds/{playground}/steps/`.
 */
export interface PlaygroundStepPathsParams {
    /** Playground folder path segment under `courses/`. */
    playgroundRelativePath: string
}
