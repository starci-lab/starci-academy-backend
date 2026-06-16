import type {
    RewardDefinition,
} from "./types"

/** Stable key of the streak-freeze reward (its redeem effect grants a freeze). */
export const STREAK_FREEZE_REWARD_KEY = "streakFreeze"

/**
 * The code-defined reward catalog ("điểm quà" gift store). Prices + copy live in
 * code so the catalog ships with the build and is the single source of truth.
 * Digital rewards apply their effect instantly (status `granted`); physical
 * rewards land `pending` for ops to fulfil.
 */
export const REWARD_CATALOG: ReadonlyArray<RewardDefinition> = [
    {
        key: STREAK_FREEZE_REWARD_KEY,
        titleEn: "Streak freeze",
        titleVi: "Đóng băng chuỗi",
        descEn: "Protects your streak when you miss a day (you can hold up to 3).",
        descVi: "Giữ chuỗi khi bạn lỡ 1 ngày (giữ tối đa 3 cái).",
        cost: 100,
        kind: "digital",
    },
    {
        key: "sticker",
        titleEn: "StarCi sticker pack",
        titleVi: "Bộ sticker StarCi",
        descEn: "A physical StarCi sticker pack shipped to you.",
        descVi: "Bộ sticker StarCi gửi tận tay bạn.",
        cost: 300,
        kind: "physical",
    },
    {
        key: "tshirt",
        titleEn: "StarCi T-shirt",
        titleVi: "Áo thun StarCi",
        descEn: "An exclusive StarCi T-shirt shipped to you.",
        descVi: "Áo thun StarCi độc quyền gửi tận tay bạn.",
        cost: 1500,
        kind: "physical",
    },
]
