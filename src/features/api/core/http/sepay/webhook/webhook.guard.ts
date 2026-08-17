import {
    timingSafeEqual,
} from "node:crypto"
import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import type {
    Request,
} from "express"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    InvalidSepayIpnSecretException,
} from "@modules/platform/exceptions/errors/payment/invalid-sepay-ipn-secret"
import {
    SepayIpnSecretNotConfiguredException,
} from "@modules/platform/exceptions/errors/payment/sepay-ipn-secret-not-configured"

@Injectable()
/** Authenticate SePay Payment Gateway IPN requests before CQRS dispatch. */
export class SepayWebhookGuard implements CanActivate {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
    ) {}

    /** Compare the inbound `X-Secret-Key` with the dedicated mounted secret. */
    canActivate(context: ExecutionContext): boolean {
        const expected = this.mountFilesystemService.sepayIpnSecret().trim()
        if (!expected) {
            throw new SepayIpnSecretNotConfiguredException({
            })
        }

        const request = context.switchToHttp().getRequest<Request>()
        const rawHeader = request.headers["x-secret-key"]
        const presented = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
        if (!presented) {
            throw new InvalidSepayIpnSecretException({
            })
        }

        const expectedBuffer = Buffer.from(expected)
        const presentedBuffer = Buffer.from(presented)
        if (
            expectedBuffer.length !== presentedBuffer.length
            || !timingSafeEqual(expectedBuffer,
                presentedBuffer)
        ) {
            throw new InvalidSepayIpnSecretException({
            })
        }
        return true
    }
}
