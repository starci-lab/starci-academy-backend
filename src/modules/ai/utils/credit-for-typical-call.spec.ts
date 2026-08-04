import {
    AI_CREDITS_PER_USD,
} from "../constants/credit-cost"
import {
    creditForTypicalCall,
    creditRateFromUsd,
} from "./credit-for-typical-call"
import {
    estimateUsdPerCall,
} from "./compute-model-weight"

/** The three seeded roster models. */
const QWEN_FLASH = {
    priceInUsdPerMTok: 0.03,
    priceOutUsdPerMTok: 0.13,
}
const DEEPSEEK_FLASH = {
    priceInUsdPerMTok: 0.09,
    priceOutUsdPerMTok: 0.18,
}
const GPT_LUNA = {
    priceInUsdPerMTok: 0.10,
    priceOutUsdPerMTok: 0.60,
}

describe("creditRateFromUsd",
    () => {
        it("converts a USD price into credits at the published exchange rate",
            () => {
                expect(creditRateFromUsd(0.09)).toBe(Math.round(0.09 * AI_CREDITS_PER_USD))
                expect(creditRateFromUsd(0.09)).toBe(450)
            })

        it("keeps a free model free",
            () => {
                expect(creditRateFromUsd(0)).toBe(0)
            })
    })

describe("creditForTypicalCall",
    () => {
        it("charges more for a dearer model, in price order",
            () => {
                const qwen = creditForTypicalCall(QWEN_FLASH)
                const deepseek = creditForTypicalCall(DEEPSEEK_FLASH)
                const luna = creditForTypicalCall(GPT_LUNA)

                expect(qwen).toBeLessThan(deepseek)
                expect(deepseek).toBeLessThan(luna)
            })

        it("tracks the real dollar cost of the call, not a per-tier round number",
            () => {
                // the charge must be within a credit of the true cost converted at the
                // published rate — this is what makes a credit MEAN something
                for (const model of [
                    QWEN_FLASH,
                    DEEPSEEK_FLASH,
                    GPT_LUNA,
                ]) {
                    const trueCredits = estimateUsdPerCall(model) * AI_CREDITS_PER_USD
                    const charged = creditForTypicalCall(model)
                    expect(charged).toBeGreaterThanOrEqual(Math.floor(trueCredits))
                    expect(charged - trueCredits).toBeLessThan(1)
                }
            })

        it("never bills a priced call as free",
            () => {
                // a very cheap model still rounds up to one credit rather than to zero
                expect(creditForTypicalCall({
                    priceInUsdPerMTok: 0.001,
                    priceOutUsdPerMTok: 0.001,
                })).toBeGreaterThanOrEqual(1)
            })

        it("bills a genuinely free model as free",
            () => {
                expect(creditForTypicalCall({
                    priceInUsdPerMTok: 0,
                    priceOutUsdPerMTok: 0,
                })).toBe(0)
            })

        it("no longer bills a cheap model at a frontier tier's flat rate",
            () => {
                // the seed used to carry hand-set per-category constants (0 / 211 / 887).
                // The workhorse now costs single digits, because that is what it costs.
                expect(creditForTypicalCall(DEEPSEEK_FLASH)).toBeLessThan(211)
            })
    })
