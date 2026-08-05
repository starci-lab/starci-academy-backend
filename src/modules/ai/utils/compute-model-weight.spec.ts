import {
    computeModelWeight,
    estimateUsdPerCall,
    WEIGHT_CONTEXT_REFERENCE_TOKENS,
    WEIGHT_COST_REFERENCE_USD,
} from "./compute-model-weight"

/** The three seeded roster models, with the prices/windows the seed records. */
const QWEN_FLASH = {
    priceInUsdPerMTok: 0.03,
    priceOutUsdPerMTok: 0.13,
    contextWindowTokens: 1_000_000,
}
const DEEPSEEK_FLASH = {
    priceInUsdPerMTok: 0.09,
    priceOutUsdPerMTok: 0.18,
    contextWindowTokens: 1_048_576,
}
const GPT_LUNA = {
    priceInUsdPerMTok: 0.10,
    priceOutUsdPerMTok: 0.60,
    contextWindowTokens: 1_050_000,
}

describe("computeModelWeight",
    () => {
        describe("estimateUsdPerCall",
            () => {
                it("prices a call with the billing estimator's own 1500/800 token mix",
                    () => {
                        // (1500 x 0.09 + 800 x 0.18) / 1e6
                        expect(estimateUsdPerCall(DEEPSEEK_FLASH)).toBeCloseTo(0.000279,
                            9)
                    })

                it("charges nothing for a zero-priced model",
                    () => {
                        expect(estimateUsdPerCall({
                            priceInUsdPerMTok: 0,
                            priceOutUsdPerMTok: 0,
                        })).toBe(0)
                    })
            })

        describe("ordering — cheaper and roomier ranks earlier",
            () => {
                it("ranks the roster cheapest-first, which is the seeded chain order",
                    () => {
                        const weights = [
                            QWEN_FLASH,
                            DEEPSEEK_FLASH,
                            GPT_LUNA,
                        ].map(computeModelWeight)

                        // qwen (cheapest) > deepseek > luna (dearest)
                        expect(weights[0]).toBeGreaterThan(weights[1])
                        expect(weights[1]).toBeGreaterThan(weights[2])
                    })

                it("puts a cheaper model ahead when the context window is identical",
                    () => {
                        const dear = computeModelWeight({
                            priceInUsdPerMTok: 1,
                            priceOutUsdPerMTok: 1,
                            contextWindowTokens: 500_000,
                        })
                        const cheap = computeModelWeight({
                            priceInUsdPerMTok: 0.1,
                            priceOutUsdPerMTok: 0.1,
                            contextWindowTokens: 500_000,
                        })
                        expect(cheap).toBeGreaterThan(dear)
                    })

                it("puts a roomier model ahead when the price is identical",
                    () => {
                        const small = computeModelWeight({
                            priceInUsdPerMTok: 0.1,
                            priceOutUsdPerMTok: 0.2,
                            contextWindowTokens: 256_000,
                        })
                        const roomy = computeModelWeight({
                            priceInUsdPerMTok: 0.1,
                            priceOutUsdPerMTok: 0.2,
                            contextWindowTokens: 1_000_000,
                        })
                        expect(roomy).toBeGreaterThan(small)
                    })
            })

        describe("neutral references",
            () => {
                it("scores exactly 1 when the model sits on both reference points",
                    () => {
                        // a call costing exactly WEIGHT_COST_REFERENCE_USD at the reference window
                        const priceOutUsdPerMTok = (WEIGHT_COST_REFERENCE_USD * 1_000_000) / 800
                        expect(computeModelWeight({
                            priceInUsdPerMTok: 0,
                            priceOutUsdPerMTok,
                            contextWindowTokens: WEIGHT_CONTEXT_REFERENCE_TOKENS,
                        })).toBeCloseTo(1,
                            6)
                    })
            })

        describe("missing metrics stay neutral — never zero",
            () => {
                it("treats an unrecorded context window as neutral, not as no capacity",
                    () => {
                        const withoutWindow = computeModelWeight({
                            priceInUsdPerMTok: 0.09,
                            priceOutUsdPerMTok: 0.18,
                        })
                        const atReference = computeModelWeight({
                            priceInUsdPerMTok: 0.09,
                            priceOutUsdPerMTok: 0.18,
                            contextWindowTokens: WEIGHT_CONTEXT_REFERENCE_TOKENS,
                        })
                        expect(withoutWindow).toBeGreaterThan(0)
                        expect(withoutWindow).toBeCloseTo(atReference,
                            9)
                    })

                it("treats an explicit null window the same as an absent one",
                    () => {
                        expect(computeModelWeight({
                            priceInUsdPerMTok: 0.09,
                            priceOutUsdPerMTok: 0.18,
                            contextWindowTokens: null,
                        })).toBeCloseTo(
                            computeModelWeight({
                                priceInUsdPerMTok: 0.09,
                                priceOutUsdPerMTok: 0.18,
                            }),
                            9,
                        )
                    })
            })

        describe("a free model does not blow up the score",
            () => {
                it("yields a large but finite weight instead of Infinity",
                    () => {
                        const weight = computeModelWeight({
                            priceInUsdPerMTok: 0,
                            priceOutUsdPerMTok: 0,
                            contextWindowTokens: 1_000_000,
                        })
                        expect(Number.isFinite(weight)).toBe(true)
                        expect(weight).toBeGreaterThan(computeModelWeight(QWEN_FLASH))
                    })
            })
    })
