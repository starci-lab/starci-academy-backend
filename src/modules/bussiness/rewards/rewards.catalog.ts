import type {
    RewardDefinition,
} from "./types"

/** Stable key of the streak-freeze reward (its redeem effect grants a freeze). */
export const STREAK_FREEZE_REWARD_KEY = "streakFreeze"

/** Stable key of the 10%-off voucher reward (its redeem effect mints a voucher). */
export const VOUCHER_10_REWARD_KEY = "voucher10"

/** Stable key of the AI-credit top-up reward (its redeem effect grants bonus credit). */
export const AI_CREDIT_BOOST_REWARD_KEY = "aiCreditBoost"

/**
 * The code-defined reward catalog (the Coin shop). Prices + copy live in
 * code so the catalog ships with the build and is the single source of truth.
 * Digital rewards apply their effect instantly (status `granted`); physical
 * rewards land `pending` for ops to fulfil; voucher/aiCredit rewards are
 * digital effects too (mint a code / top up credit) — see {@link RewardsService.redeem}.
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
        key: AI_CREDIT_BOOST_REWARD_KEY,
        titleEn: "AI credit top-up",
        titleVi: "Nạp thêm hạn mức AI",
        descEn: "+30 AI credits for your current 5h + weekly window.",
        descVi: "+30 credit AI cho hạn mức 5 giờ và hạn mức tuần hiện tại.",
        cost: 500,
        kind: "aiCredit",
        aiCredit: {
            amount5h: 30,
            amountWeek: 30,
        },
    },
    {
        key: VOUCHER_10_REWARD_KEY,
        titleEn: "10% off any course",
        titleVi: "Voucher giảm 10% mọi khóa học",
        descEn: "A one-time 10%-off code, valid on any course for 30 days.",
        descVi: "Mã giảm 10% dùng 1 lần cho bất kỳ khóa học nào, hiệu lực 30 ngày.",
        cost: 800,
        kind: "voucher",
        voucher: {
            discountType: "percent",
            value: 10,
            validityDays: 30,
        },
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
