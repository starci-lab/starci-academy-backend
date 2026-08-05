import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    VoucherService,
} from "./voucher.service"
import {
    CourseVoucherEntity,
} from "@modules/databases/postgresql/primary/entities/course-voucher.entity"
import {
    VoucherDiscountType,
} from "@modules/databases/postgresql/primary/enums/voucher-discount-type"
import {
    VoucherStatus,
} from "@modules/databases/postgresql/primary/enums/voucher-status"
import {
    InvalidVoucherException,
} from "@modules/platform/exceptions/errors/vouchers/invalid-voucher"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("VoucherService",
    () => {
        let module: TestingModule
        let service: VoucherService
        let entityManager: EntityManagerMock

        const userId = "user-1"
        const courseId = "course-1"
        const code = "7K4P-QX9M"
        const transactionId = "txn-1"

        /** A future expiry so a voucher is not expired unless a test overrides it. */
        const futureExpiry = () => new Date(Date.now() + 1000 * 60 * 60 * 24)
        /** A past expiry, used to exercise the expiry rejection branch. */
        const pastExpiry = () => new Date(Date.now() - 1000 * 60 * 60)

        /** A valid, redeemable voucher row -- tests override just the field under test. */
        const makeVoucher = (
            overrides: Partial<CourseVoucherEntity> = {
            },
        ): CourseVoucherEntity => ({
            id: "voucher-1",
            userId,
            courseId: null,
            code,
            discountType: VoucherDiscountType.Percent,
            value: 10,
            status: VoucherStatus.Unused,
            expiresAt: futureExpiry(),
            usedAt: null,
            reservedTransactionId: null,
            ...overrides,
        } as CourseVoucherEntity)

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    VoucherService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<VoucherService>(VoucherService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("applyToAmount",
            () => {
                it("Percent takes value% off, currency-agnostic (works for a VND amount)",
                    () => {
                        const result = service.applyToAmount(100000,
                            {
                                discountType: VoucherDiscountType.Percent,
                                value: 10,
                            })

                        expect(result).toBe(90000)
                    })

                it("Percent works the same for a small USD-scale amount (currency-agnostic)",
                    () => {
                        const result = service.applyToAmount(99,
                            {
                                discountType: VoucherDiscountType.Percent,
                                value: 15,
                            })

                        // 99 * 0.85 = 84.15 -> rounded
                        expect(result).toBe(84)
                    })

                it("Flat subtracts a flat amount off",
                    () => {
                        const result = service.applyToAmount(100000,
                            {
                                discountType: VoucherDiscountType.Flat,
                                value: 20000,
                            })

                        expect(result).toBe(80000)
                    })

                it("floors at 0 rather than going negative when Flat exceeds the amount",
                    () => {
                        const result = service.applyToAmount(10000,
                            {
                                discountType: VoucherDiscountType.Flat,
                                value: 20000,
                            })

                        expect(result).toBe(0)
                    })
            })

        describe("reserve",
            () => {
                it("locks and flips an unused, owned, in-scope voucher to Reserved",
                    async () => {
                        const voucher = makeVoucher()
                        const queryBuilder = entityManager.createQueryBuilder()
                        queryBuilder.getOne.mockResolvedValueOnce(voucher)

                        const result = await service.reserve({
                            entityManager,
                            userId,
                            code,
                            courseId,
                            transactionId,
                        })

                        expect(queryBuilder.setLock).toHaveBeenCalledWith("pessimistic_write")
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.objectContaining({
                                status: VoucherStatus.Reserved,
                                reservedTransactionId: transactionId,
                            }),
                        )
                        expect(result.discountType).toBe(VoucherDiscountType.Percent)
                        expect(result.value).toBe(10)
                    })

                it("throws InvalidVoucherException(unknown) when the code doesn't exist",
                    async () => {
                        const queryBuilder = entityManager.createQueryBuilder()
                        queryBuilder.getOne.mockResolvedValueOnce(null)

                        await expect(
                            service.reserve({
                                entityManager,
                                userId,
                                code,
                                courseId,
                                transactionId,
                            }),
                        ).rejects.toMatchObject({
                            metadata: {
                                reason: "unknown",
                            },
                        })
                    })

                it("throws InvalidVoucherException(unknown) when the voucher belongs to another user",
                    async () => {
                        const queryBuilder = entityManager.createQueryBuilder()
                        queryBuilder.getOne.mockResolvedValueOnce(
                            makeVoucher({
                                userId: "someone-else",
                            }),
                        )

                        await expect(
                            service.reserve({
                                entityManager,
                                userId,
                                code,
                                courseId,
                                transactionId,
                            }),
                        ).rejects.toMatchObject({
                            metadata: {
                                reason: "unknown",
                            },
                        })
                    })

                it("throws InvalidVoucherException(expired) when past expiresAt (even though status is still Unused)",
                    async () => {
                        const queryBuilder = entityManager.createQueryBuilder()
                        queryBuilder.getOne.mockResolvedValueOnce(
                            makeVoucher({
                                expiresAt: pastExpiry(),
                            }),
                        )

                        await expect(
                            service.reserve({
                                entityManager,
                                userId,
                                code,
                                courseId,
                                transactionId,
                            }),
                        ).rejects.toMatchObject({
                            metadata: {
                                reason: "expired",
                            },
                        })
                    })

                it("throws InvalidVoucherException(alreadyUsed) when status is not Unused",
                    async () => {
                        const queryBuilder = entityManager.createQueryBuilder()
                        queryBuilder.getOne.mockResolvedValueOnce(
                            makeVoucher({
                                status: VoucherStatus.Used,
                            }),
                        )

                        await expect(
                            service.reserve({
                                entityManager,
                                userId,
                                code,
                                courseId,
                                transactionId,
                            }),
                        ).rejects.toMatchObject({
                            metadata: {
                                reason: "alreadyUsed",
                            },
                        })
                    })

                it("throws InvalidVoucherException(wrongCourse) when scoped to a different course",
                    async () => {
                        const queryBuilder = entityManager.createQueryBuilder()
                        queryBuilder.getOne.mockResolvedValueOnce(
                            makeVoucher({
                                courseId: "another-course",
                            }),
                        )

                        await expect(
                            service.reserve({
                                entityManager,
                                userId,
                                code,
                                courseId,
                                transactionId,
                            }),
                        ).rejects.toMatchObject({
                            metadata: {
                                reason: "wrongCourse",
                            },
                        })
                    })
            })

        describe("markUsed",
            () => {
                it("flips a Reserved voucher matching the transaction to Used and stamps usedAt",
                    async () => {
                        const voucher = makeVoucher({
                            status: VoucherStatus.Reserved,
                            reservedTransactionId: transactionId,
                        })
                        entityManager.findOne.mockResolvedValueOnce(voucher)

                        await service.markUsed({
                            entityManager,
                            transactionId,
                        })

                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            CourseVoucherEntity,
                            {
                                where: {
                                    reservedTransactionId: transactionId,
                                    status: VoucherStatus.Reserved,
                                },
                            },
                        )
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.objectContaining({
                                status: VoucherStatus.Used,
                                usedAt: expect.any(Date),
                            }),
                        )
                    })

                it("no-ops when the transaction reserved no voucher",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await service.markUsed({
                            entityManager,
                            transactionId,
                        })

                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("release",
            () => {
                it("returns a Reserved voucher to Unused and clears the reservation",
                    async () => {
                        const voucher = makeVoucher({
                            status: VoucherStatus.Reserved,
                            reservedTransactionId: transactionId,
                        })
                        entityManager.findOne.mockResolvedValueOnce(voucher)

                        await service.release({
                            entityManager,
                            transactionId,
                        })

                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.objectContaining({
                                status: VoucherStatus.Unused,
                                reservedTransactionId: null,
                            }),
                        )
                    })

                it("no-ops when the transaction reserved no voucher",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await service.release({
                            entityManager,
                            transactionId,
                        })

                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("previewDiscount",
            () => {
                it("resolves a valid, owned, in-scope voucher without mutating it",
                    async () => {
                        const voucher = makeVoucher()
                        entityManager.findOne.mockResolvedValueOnce(voucher)

                        const result = await service.previewDiscount({
                            userId,
                            code,
                            courseId,
                        })

                        expect(result).toEqual({
                            voucher,
                            discountType: VoucherDiscountType.Percent,
                            value: 10,
                        })
                        // preview is read-only -- never writes back
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("throws InvalidVoucherException(unknown) when the code isn't owned by this user",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            makeVoucher({
                                userId: "someone-else",
                            }),
                        )

                        await expect(
                            service.previewDiscount({
                                userId,
                                code,
                                courseId,
                            }),
                        ).rejects.toBeInstanceOf(InvalidVoucherException)
                    })

                it("throws InvalidVoucherException(expired) for a voucher past its expiry",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            makeVoucher({
                                expiresAt: pastExpiry(),
                            }),
                        )

                        await expect(
                            service.previewDiscount({
                                userId,
                                code,
                                courseId,
                            }),
                        ).rejects.toMatchObject({
                            metadata: {
                                reason: "expired",
                            },
                        })
                    })

                it("throws InvalidVoucherException(wrongCourse) when scoped to a different course",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            makeVoucher({
                                courseId: "another-course",
                            }),
                        )

                        await expect(
                            service.previewDiscount({
                                userId,
                                code,
                                courseId,
                            }),
                        ).rejects.toMatchObject({
                            metadata: {
                                reason: "wrongCourse",
                            },
                        })
                    })
            })
    })
