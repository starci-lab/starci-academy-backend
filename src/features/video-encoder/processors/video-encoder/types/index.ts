/**
 * Empty on purpose -- steps persist side-effects via `JobActionService`, and the
 * worker loop never reads a typed return. Pinning `{}` stops a future step from
 * silently returning data nobody consumes.
 */
export type VideoEncoderStepExecutionResult = {}
export * from "./parse-s3-url"
