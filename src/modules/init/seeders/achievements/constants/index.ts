import {
    AchievementCriteriaType,
} from "@modules/databases"
import type {
    AchievementSeedItem,
} from "../types"

/**
 * The curated starter achievements seeded on boot (upserted by `slug`). A small
 * fixed reference set — kept in code (not ops-editable YAML) because the values
 * are part of the product spec, not a runtime catalog. Add new badges here.
 */
export const STARTER_ACHIEVEMENTS: ReadonlyArray<AchievementSeedItem> = [
    {
        slug: "first-steps",
        name: {
            en: "First Steps",
            vi: "Bước Đầu Tiên",
        },
        description: {
            en: "Read your first lesson.",
            vi: "Đọc bài học đầu tiên của bạn.",
        },
        criteriaType: AchievementCriteriaType.LessonsRead,
        threshold: 1,
        sortIndex: 0,
    },
    {
        slug: "on-fire",
        name: {
            en: "On Fire",
            vi: "Bùng Cháy",
        },
        description: {
            en: "Keep a 7-day learning streak.",
            vi: "Duy trì chuỗi học 7 ngày liên tiếp.",
        },
        criteriaType: AchievementCriteriaType.StreakDays,
        threshold: 7,
        sortIndex: 1,
    },
    {
        slug: "challenger",
        name: {
            en: "Challenger",
            vi: "Người Thách Đấu",
        },
        description: {
            en: "Pass challenges to climb the tiers.",
            vi: "Vượt qua các thử thách để thăng hạng.",
        },
        criteriaType: AchievementCriteriaType.ChallengesPassed,
        // tiered like GitHub Pull Shark x2/x3/x4 — first tier is the threshold
        threshold: 10,
        tierThresholds: [
            10,
            25,
            50,
        ],
        sortIndex: 2,
    },
    {
        slug: "milestone-master",
        name: {
            en: "Milestone Master",
            vi: "Bậc Thầy Cột Mốc",
        },
        description: {
            en: "Pass milestone tasks on your capstone project.",
            vi: "Hoàn thành các nhiệm vụ cột mốc trong dự án của bạn.",
        },
        criteriaType: AchievementCriteriaType.MilestonesPassed,
        // tiered — first tier is the threshold
        threshold: 1,
        tierThresholds: [
            1,
            10,
            25,
        ],
        sortIndex: 3,
    },
    {
        slug: "polyglot",
        name: {
            en: "Polyglot",
            vi: "Người Đa Lĩnh Vực",
        },
        description: {
            en: "Enroll in two or more courses.",
            vi: "Đăng ký từ hai khóa học trở lên.",
        },
        criteriaType: AchievementCriteriaType.CoursesEnrolled,
        threshold: 2,
        sortIndex: 4,
    },
]
