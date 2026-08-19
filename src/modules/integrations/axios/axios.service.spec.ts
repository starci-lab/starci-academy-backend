import * as fs from "fs"
import * as path from "path"

describe("AxiosService source boundary",
    () => {
        it("never calls Math.random() directly -- all jitter routes through computeRetryDelayWithJitter",
            () => {
                // Guards against the exact failure mode this hardening targets:
                // a future retry tweak re-inlining `Math.random()` here instead
                // of reusing the single, branded, unit-tested helper. If this
                // string reappears in this file, this test goes red.
                const source = fs.readFileSync(
                    path.join(
                        __dirname,
                        "axios.service.ts"
                    ),
                    "utf-8"
                )
                expect(source).not.toContain("Math.random")
                expect(source).toContain("computeRetryDelayWithJitter")
            })
    })
