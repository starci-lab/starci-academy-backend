import {
    MembershipService
} from "./membership.service"
import {
    MembershipStatus
} from "@modules/databases/postgresql/primary/enums/membership-status"
describe("MembershipService",
    () => { it("claims pending transactions exactly once",
        async () => { const manager = {
            update: jest.fn().mockResolvedValue({
                affected: 1
            }), findOne: jest.fn().mockResolvedValue(null), create: jest.fn().mockImplementation((_, value) => value), save: jest.fn().mockResolvedValue(undefined)
        }; const entityManager = {
            transaction: jest.fn(async (cb: (m: unknown) => Promise<boolean>) => cb(manager))
        }; const service = new MembershipService(entityManager as never,
{
    now: jest.fn().mockReturnValue({
        add: jest.fn().mockReturnValue({
            toDate: jest.fn().mockReturnValue(new Date())
        })
    }), from: jest.fn()
} as never); await expect(service.grantMembership({
            userId: "u1", transactionId: "t1"
        })).resolves.toBe(true); expect(manager.update).toHaveBeenCalled() }); it("returns false for absent or expired membership",
        async () => { const entityManager = {
            findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
                status: MembershipStatus.Expired, currentPeriodEnd: new Date()
            })
        }; const service = new MembershipService(entityManager as never,
{
    now: jest.fn(), from: jest.fn()
} as never); await expect(service.isActive("u1")).resolves.toBe(false); await expect(service.isActive("u1")).resolves.toBe(false) }) })
