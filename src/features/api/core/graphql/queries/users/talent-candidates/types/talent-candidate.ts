import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    CvVerificationLevel,
} from "@modules/databases/postgresql/primary/enums/cv-verification-level"
import type {
    JobReadinessBand,
    JobReadinessTrack,
} from "../../job-readiness/types/job-readiness"

/**
 * The single-track readiness snapshot a recruiter sees for a candidate on the
 * marketplace -- the SAME shape as a {@link JobReadinessTrack} card, but scoped
 * to the ONE track (course) currently being filtered on. There is deliberately
 * no cross-track composite here: a candidate is ranked purely on THIS track's
 * `depthScore`, never a blend of every course they own.
 *
 * Reuses {@link JobReadinessTrack} verbatim (imported, not re-declared) so the
 * per-track fairness contract stays single-sourced with `JobReadinessService`.
 */
export type TalentCandidateTrack = JobReadinessTrack

/** Re-export the shared band type so consumers import it from one place. */
export type TalentCandidateBand = JobReadinessBand

/**
 * One ranked candidate for the recruiter marketplace: the open-to-work user plus
 * the readiness card for the ONE filtered track. Ordered by `track.depthScore`
 * DESC within that single track only.
 */
export interface TalentCandidate {
    /** The open-to-work user (public header fields render the candidate card). */
    user: UserEntity
    /** This candidate's readiness card for the filtered track only. */
    track: TalentCandidateTrack
    /**
     * How strongly this candidate's readiness is backed by graded StarCi work --
     * a recruiter trust badge (self-reported vs activity-backed vs capstone-verified)
     * and the secondary rank key that breaks equal-`depthScore` ties.
     */
    verificationLevel: CvVerificationLevel
}

/** Params for {@link import("../talent-candidates.service").TalentCandidatesService.rankByTrack}. */
export interface RankTalentCandidatesByTrackParams {
    /**
     * The track identity to filter + rank on -- the `courseId` of a
     * {@link JobReadinessTrack} (matches `enrollments.course_id`). Ranking is
     * scoped to THIS course's depth only.
     */
    courseId: string
    /** Max candidates per page (already clamped by the resolver). */
    limit: number
    /** Rows to skip (offset pagination). */
    offset: number
}
