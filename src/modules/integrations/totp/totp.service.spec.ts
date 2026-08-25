import {
    TotpService 
} from "./totp.service"

describe("TotpService",
    () => {
        it("generates an enrollment URI and verifies a generated code",
            () => {
                const service = new TotpService(); const secret = service.generateSecret(); const uri = service.generateKeyUri({
                    secret, accountName: "user@example.com" 
                })
                expect(secret).toMatch(/^[A-Z2-7]+=*$/u); expect(uri).toContain("otpauth://totp/")
                const internals = service as unknown as { generateForCounter: jest.Mock<string, [Buffer, number]> }
                internals.generateForCounter = jest.fn().mockReturnValue("123456")
                expect(service.verify({
                    secret, token: "123 456", timestampMs: 0 
                })).toBe(true)
            })
        it("rejects malformed tokens",
            () => { const service = new TotpService(); expect(service.verify({
                secret: service.generateSecret(), token: "bad" 
            })).toBe(false) })
    })
