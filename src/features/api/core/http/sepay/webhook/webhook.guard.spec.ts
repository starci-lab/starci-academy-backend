import type {
    ExecutionContext,
} from "@nestjs/common"
import type {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    InvalidSepayIpnSecretException,
} from "@modules/platform/exceptions/errors/payment/invalid-sepay-ipn-secret"
import {
    SepayIpnSecretNotConfiguredException,
} from "@modules/platform/exceptions/errors/payment/sepay-ipn-secret-not-configured"
import {
    SepayWebhookGuard,
} from "./webhook.guard"

describe("SepayWebhookGuard",
    () => {
        const context = (value?: string | Array<string>): ExecutionContext => ({
            switchToHttp: () => ({
                getRequest: () => ({
                    headers: {
                        "x-secret-key": value,
                    },
                }),
            }),
        }) as unknown as ExecutionContext

        const guard = (mountedSecret: string): SepayWebhookGuard =>
            new SepayWebhookGuard({
                sepayIpnSecret: jest.fn(() => mountedSecret),
            } as unknown as MountFilesystemService)

        it("accepts the exact mounted secret",
            () => {
                expect(guard("expected-secret").canActivate(context("expected-secret"))).toBe(true)
            })

        it("uses the first value when Node supplies an array header",
            () => {
                expect(guard("expected-secret").canActivate(context([
                    "expected-secret",
                    "ignored",
                ]))).toBe(true)
            })

        it.each([
            undefined,
            "wrong-secret-1",
            "short",
        ])("rejects a missing or mismatched secret: %s",
            (provided) => {
                expect(() => guard("expected-secret").canActivate(context(provided)))
                    .toThrow(InvalidSepayIpnSecretException)
            })

        it("fails closed when the mounted secret is blank",
            () => {
                expect(() => guard("  ").canActivate(context("anything")))
                    .toThrow(SepayIpnSecretNotConfiguredException)
            })
    })
