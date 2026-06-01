/**
 * Injectable UUID factories for course seed graphs: each `generate` hashes a typed
 * preimage (via `Sha256Service`) then applies UUID v5 with `envConfig().uuidNamespace.course`.
 *
 * Indices are **ordinals** (0-based list positions), not `CourseId` slugs—distinct from
 * `data/utils/ids` `build*` helpers used by static markdown seeds.
 */
export * from "./types"
export * from "./course.service"
export * from "./module.service"
export * from "./content.service"
export * from "./content-reference.service"
export * from "./code-explaining.service"
export * from "./code-implementation.service"
export * from "./content-body.service"
export * from "./content-learning-outcome.service"
export * from "./preview-content.service"
export * from "./pricing-phase.service"
export * from "./value-proposition.service"
export * from "./prerequisite.service"
export * from "./qna.service"
export * from "./livestream-session.service"
export * from "./challenge.service"
export * from "./challenge-requirement.service"
export * from "./challenge-output.service"
export * from "./challenge-prerequisite.service"
export * from "./challenge-step.service"
export * from "./challenge-step-code-implementation.service"
export * from "./challenge-requirement-v2.service"
export * from "./challenge-step-v2.service"
export * from "./challenge-output-v2.service"
export * from "./challenge-prerequisite-v2.service"
export * from "./challenge-reference.service"
export * from "./challenge-submission.service"
export * from "./challenge-submission-prompt.service"
export * from "./challenge-submission-criteria.service"
export * from "./quiz-deck.service"
export * from "./quiz-card.service"
export * from "./quiz-card-option.service"


export * from "./milestone.service"
export * from "./milestone-task.service"
export * from "./milestone-task-pass-criteria.service"
export * from "./milestone-task-code-implementation.service"
