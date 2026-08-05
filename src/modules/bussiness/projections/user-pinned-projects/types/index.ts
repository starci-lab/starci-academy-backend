import type {
    EntityManager,
} from "typeorm"
import type {
    ProjectPinType,
} from "@modules/databases"

/** Params for recomputing one user's pinned-projects projection row. */
export interface RecomputeUserPinnedProjectsParams {
    /** The user whose pinned-projects aggregate to rebuild. */
    userId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** CDC row from `user_pinned_projects` (carries its owner user_id directly). */
export interface PinnedProjectCdcRow {
    /** Owner user id of the changed pin. */
    user_id?: string
    /** Linked enrollment id (course pins only). */
    enrollment_id?: string | null
}

/** CDC row from `enrollments` (used to reverse-resolve affected pin owners). */
export interface PinnedProjectsEnrollmentCdcRow {
    /** The changed enrollment's id -- pins referencing it must recompute. */
    id?: string
}

/** CDC row from `courses` (used to reverse-resolve affected pin owners). */
export interface PinnedProjectsCourseCdcRow {
    /** The changed course's id -- pins whose enrollment points at it must recompute. */
    id?: string
}

/** Raw row resolving the owning user id(s) of pins referencing some upstream key. */
export interface PinnedProjectUserIdRow {
    /** A user who owns a pin affected by the upstream change. */
    user_id: string
}

/**
 * One pinned project inside the projection's jsonb `value.pins` (raw jsonb
 * shape). Ordering is baked into the array (by `orderIndex` ascending).
 */
export interface UserPinnedProjectValue {
    /** Pin primary-key id. */
    id: string
    /** Pin kind discriminator (course | external). */
    type: ProjectPinType
    /** Resolved display title (course title fallback for course pins), or null. */
    title: string | null
    /** Free-form description shown under the pin, or null. */
    description: string | null
    /** Project URL, or null. */
    url: string | null
    /** Technology stack tags, or null. */
    techStack: Array<string> | null
    /** Whether this pin is a verified StarCi capstone. */
    isVerified: boolean
    /** Display order within the user's pinned-projects list (ascending). */
    orderIndex: number
}

/** One pinned project in the typed view returned by the service. */
export interface UserPinnedProjectResult {
    /** Pin primary-key id. */
    id: string
    /** Pin kind discriminator (course | external). */
    type: ProjectPinType
    /** Resolved display title (course title fallback for course pins), or null. */
    title: string | null
    /** Free-form description shown under the pin, or null. */
    description: string | null
    /** Project URL, or null. */
    url: string | null
    /** Technology stack tags, or null. */
    techStack: Array<string> | null
    /** Whether this pin is a verified StarCi capstone. */
    isVerified: boolean
    /** Display order within the user's pinned-projects list (ascending). */
    orderIndex: number
}
