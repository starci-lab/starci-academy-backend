import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    CvVerificationLevel,
} from "@modules/databases/postgresql/primary/enums/cv-verification-level"
import type {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    CvVerificationService,
} from "./cv-verification.service"
import {
    ConsultantContactGateService,
} from "./consultant-contact-gate.service"
import {
    CV_SCORE_UNLOCK_THRESHOLD,
} from "./constants"

/**
 * Unit suite for {@link ConsultantContactGateService}. {@link CvVerificationService}
 * is mocked (no DB); `gateConsultant` is pure.
 *
 * Locks the fair-monetization axiom: contact reveal keys ONLY on the viewer's
 * deterministic CV trust score -- never on how many CVs/courses produced it
 * (2026-07-05: score is now `CvVerificationService.scoreOf(resolveLevel(...))`,
 * count-independent by construction -- no AI, no CV row, no `source` read here).
 */
describe("ConsultantContactGateService",
    () => {
        let module: TestingModule
        let service: ConsultantContactGateService
        let cvVerificationService: jest.Mocked<
            Pick<CvVerificationService, "resolveLevel" | "scoreOf">
        >

        beforeEach(async () => {
            cvVerificationService = {
                resolveLevel: jest.fn(),
                scoreOf: jest.fn((level: CvVerificationLevel) => {
                    // capstone-only score (2026-07-05): only a passed capstone
                    // scores; activity-backed (challenge) scores 0 like self-reported
                    switch (level) {
                    case CvVerificationLevel.CapstoneVerified:
                        return 100
                    case CvVerificationLevel.ActivityBacked:
                    case CvVerificationLevel.SelfReported:
                        return 0
                    }
                }),
            } as unknown as jest.Mocked<
                Pick<CvVerificationService, "resolveLevel" | "scoreOf">
            >

            module = await Test.createTestingModule({
                providers: [
                    ConsultantContactGateService,
                    {
                        provide: CvVerificationService,
                        useValue: cvVerificationService,
                    },
                ],
            }).compile()

            service = module.get<ConsultantContactGateService>(
                ConsultantContactGateService,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getBestCvScore",
            () => {
                it("returns the deterministic score for the viewer's verification level",
                    async () => {
                        cvVerificationService.resolveLevel.mockResolvedValueOnce(
                            CvVerificationLevel.CapstoneVerified,
                        )

                        const best = await service.getBestCvScore({
                            userId: "viewer-1",
                        })

                        expect(best).toBe(100)
                    })

                it("returns 0 for a self-reported (no graded StarCi work) viewer",
                    async () => {
                        cvVerificationService.resolveLevel.mockResolvedValueOnce(
                            CvVerificationLevel.SelfReported,
                        )

                        const best = await service.getBestCvScore({
                            userId: "viewer-2",
                        })

                        expect(best).toBe(0)
                    })

                it("short-circuits an anonymous viewer to 0 without resolving a level",
                    async () => {
                        // no userId -> always locked; the lookup must never run
                        const best = await service.getBestCvScore({
                            userId: null,
                        })

                        expect(best).toBe(0)
                        expect(cvVerificationService.resolveLevel).not.toHaveBeenCalled()
                    })
            })

        describe("gateConsultant",
            () => {
                it("nulls every contact field below the unlock threshold",
                    async () => {
                        const consultant = {
                            email: "hidden@example.com",
                            phoneNumber: "0000000000",
                            zaloNumber: "0000000000",
                            linkedinUrl: "https://linkedin.com/in/hidden",
                        } as ConsultantEntity

                        const gated = service.gateConsultant(
                            consultant,
                            CV_SCORE_UNLOCK_THRESHOLD - 1,
                        )

                        expect(gated.contactUnlocked).toBe(false)
                        expect(gated.cvScoreUnlockThreshold).toBe(CV_SCORE_UNLOCK_THRESHOLD)
                        expect(gated.email).toBeNull()
                        expect(gated.phoneNumber).toBeNull()
                        expect(gated.zaloNumber).toBeNull()
                        expect(gated.linkedinUrl).toBeNull()
                    })

                it("reveals every contact field at/above the unlock threshold",
                    async () => {
                        const consultant = {
                            email: "visible@example.com",
                            phoneNumber: "1111111111",
                            zaloNumber: "1111111111",
                            linkedinUrl: "https://linkedin.com/in/visible",
                        } as ConsultantEntity

                        const gated = service.gateConsultant(
                            consultant,
                            CV_SCORE_UNLOCK_THRESHOLD,
                        )

                        expect(gated.contactUnlocked).toBe(true)
                        expect(gated.email).toBe("visible@example.com")
                        expect(gated.phoneNumber).toBe("1111111111")
                        expect(gated.zaloNumber).toBe("1111111111")
                        expect(gated.linkedinUrl).toBe("https://linkedin.com/in/visible")
                    })

                // The fairness invariant: the decision reads ONLY the scalar
                // bestCvScore. Its two-arg signature has no course/CV-count param to
                // even pass, so a viewer with one high-scoring CV and a viewer with
                // many CVs summing to the same best score get the identical decision.
                it("decides purely from the scalar bestCvScore — same score, same reveal, regardless of CV/course count",
                    async () => {
                        const makeConsultant = (): ConsultantEntity => ({
                            email: "c@example.com",
                            phoneNumber: "2222222222",
                            zaloNumber: "2222222222",
                            linkedinUrl: "https://linkedin.com/in/c",
                        } as ConsultantEntity)

                        // viewer whose single CV scored exactly the threshold
                        const fromOneCv = service.gateConsultant(
                            makeConsultant(),
                            CV_SCORE_UNLOCK_THRESHOLD,
                        )
                        // viewer whose best-of-many CVs is the SAME threshold score
                        const fromManyCvs = service.gateConsultant(
                            makeConsultant(),
                            CV_SCORE_UNLOCK_THRESHOLD,
                        )

                        expect(fromOneCv.contactUnlocked).toBe(fromManyCvs.contactUnlocked)
                        expect(fromOneCv.email).toBe(fromManyCvs.email)

                        // structural guarantee: the gate takes exactly two args
                        // (consultant, bestCvScore) -- there is no count parameter
                        expect(service.gateConsultant).toHaveLength(2)
                    })
            })
    })
