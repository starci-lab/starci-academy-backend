import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    ConsultantEntity,
} from "@modules/databases"
import {
    ConsultantContactGateService,
} from "./consultant-contact-gate.service"
import {
    CV_SCORE_UNLOCK_THRESHOLD,
} from "./constants"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Unit suite for {@link ConsultantContactGateService}. `entityManager.query` is
 * mocked (no DB); `gateConsultant` is pure.
 *
 * Locks the fair-monetization axiom: contact reveal keys ONLY on the viewer's
 * best CV score — never on how many CVs/courses produced it.
 */
describe("ConsultantContactGateService",
    () => {
        let module: TestingModule
        let service: ConsultantContactGateService
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    ConsultantContactGateService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
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
                it("returns MAX(cv_generations.score) for the viewer",
                    async () => {
                        // the SQL computes MAX(...) server-side and returns one row
                        entityManager.query.mockResolvedValueOnce([
                            {
                                max: "85",
                            },
                        ])

                        const best = await service.getBestCvScore({
                            userId: "viewer-1",
                        })

                        expect(best).toBe(85)
                    })

                it("returns 0 when the viewer has no scored CV (COALESCE → -1, clamped up)",
                    async () => {
                        // the COALESCE branch falls back to -1 when there is no row
                        entityManager.query.mockResolvedValueOnce([
                            {
                                max: "-1",
                            },
                        ])

                        const best = await service.getBestCvScore({
                            userId: "viewer-2",
                        })

                        expect(best).toBe(0)
                    })

                it("short-circuits an anonymous viewer to 0 without touching the DB",
                    async () => {
                        // no userId → always locked; the query must never run
                        const best = await service.getBestCvScore({
                            userId: null,
                        })

                        expect(best).toBe(0)
                        expect(entityManager.query).not.toHaveBeenCalled()
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
                        // (consultant, bestCvScore) — there is no count parameter
                        expect(service.gateConsultant.length).toBe(2)
                    })
            })
    })
