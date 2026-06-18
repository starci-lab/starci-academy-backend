import {
    DailyQuestKey,
} from "@modules/databases"
import type {
    DailyQuestTaskDefinition,
} from "./types"

/** Points granted when the whole daily quest is completed + claimed. */
export const DAILY_QUEST_REWARD = 20

/**
 * The code-defined daily-quest tasks. Targets live in code so the quest ships
 * with the build and is the single source of truth. `current` for each task is
 * derived from TODAY's (Asia/Ho_Chi_Minh) activity by the daily-quest service.
 */
export const DAILY_QUEST_TASKS: ReadonlyArray<DailyQuestTaskDefinition> = [
    {
        key: DailyQuestKey.ReadContent,
        target: 1,
    },
    {
        key: DailyQuestKey.PassChallenge,
        target: 1,
    },
    {
        key: DailyQuestKey.ReviewFlashcards,
        target: 5,
    },
]
