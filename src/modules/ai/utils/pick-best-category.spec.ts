import {
    AiModelCategory,
} from "@modules/databases"
import {
    pickBestCategory,
} from "./pick-best-category"

describe("pickBestCategory",
    () => {
        it("falls back to Economy for an empty list",
            () => {
                // no unlocked categories → the cheapest lane is the safe default
                expect(pickBestCategory([])).toBe(AiModelCategory.Economy)
            })

        it("picks Premium over Balanced and Economy",
            () => {
                // Premium outranks both lower tiers regardless of order
                expect(
                    pickBestCategory([
                        AiModelCategory.Economy,
                        AiModelCategory.Premium,
                        AiModelCategory.Balanced,
                    ]),
                ).toBe(AiModelCategory.Premium)
            })

        it("picks Balanced over Economy when Premium is absent",
            () => {
                // highest available rank wins when Premium is not unlocked
                expect(
                    pickBestCategory([
                        AiModelCategory.Economy,
                        AiModelCategory.Balanced,
                    ]),
                ).toBe(AiModelCategory.Balanced)
            })

        it("returns the single category when only one is present",
            () => {
                // a one-element list resolves to that element
                expect(
                    pickBestCategory([
                        AiModelCategory.Economy,
                    ]),
                ).toBe(AiModelCategory.Economy)
            })
    })
