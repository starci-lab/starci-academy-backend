/**
 * Minimum best-ever CV score (0-100, `UserCvGenerationEntity.score`)
 * a user must have reached to unlock a consultant's direct contact details
 * (email / phone / Zalo / LinkedIn). Below this threshold the fields are
 * nulled out server-side and `contactUnlocked` is `false` -- headhunters only
 * want to spend time on candidates with a sufficiently polished CV.
 */
export const CV_SCORE_UNLOCK_THRESHOLD = 70
