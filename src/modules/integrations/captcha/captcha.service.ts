import {
    Injectable,
} from "@nestjs/common"
import {
    AxiosInstance,
} from "axios"
import {
    AxiosService,
} from "@modules/axios"
import {
    envConfig,
} from "@modules/env"
import {
    CAPTCHA_AXIOS_KEY,
    TURNSTILE_SITEVERIFY_URL,
} from "./constants"
import type {
    TurnstileVerifyResponse,
    VerifyCaptchaParams,
    VerifyCaptchaResult,
} from "./types"

@Injectable()
/**
 * Verifies Cloudflare Turnstile tokens server-side.
 *
 * When captcha is disabled (no secret / `CAPTCHA_ENABLED=false`) every check
 * passes — this keeps local dev and tests working without a Turnstile key.
 * In production (enabled + secret set) a missing/invalid token fails.
 *
 * @example
 * const ok = await captchaService.verify({ token, remoteIp })
 */
export class CaptchaService {
    private readonly axiosInstance: AxiosInstance

    constructor(
        private readonly axiosService: AxiosService,
    ) {
        // dedicated axios instance (cached) for the Turnstile endpoint
        this.axiosInstance = this.axiosService.create({
            key: CAPTCHA_AXIOS_KEY,
            config: {
            },
        })
    }

    /**
     * Verifies a Turnstile token against Cloudflare's siteverify API.
     *
     * @param params - The client token + optional remote IP.
     * @returns True when the token is valid (or captcha is disabled).
     *
     * @example
     * await captchaService.verify({ token: "0.abc...", remoteIp: "1.2.3.4" })
     */
    async verify({ token, remoteIp }: VerifyCaptchaParams): Promise<VerifyCaptchaResult> {
        // read the captcha config once per call (env is cheap + dynamic)
        const { enabled, turnstileSecret } = envConfig().captcha
        // disabled or unconfigured → pass through so dev/test isn't blocked
        if (!enabled || !turnstileSecret) {
            return true
        }
        // a missing token can never be valid when enforcement is on
        if (!token) {
            return false
        }
        // build the form body Cloudflare expects (urlencoded)
        const body = new URLSearchParams({
            secret: turnstileSecret,
            response: token,
        })
        // forward the client IP when we have one (optional extra signal)
        if (remoteIp) {
            body.set("remoteip",
                remoteIp)
        }
        try {
            // POST to siteverify; Cloudflare returns { success, error-codes, ... }
            const response = await this.axiosInstance.post<TurnstileVerifyResponse>(
                TURNSTILE_SITEVERIFY_URL,
                body,
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
            )
            // trust only an explicit success flag from Cloudflare
            return response.data.success === true
        } catch {
            // network/verify failure → fail closed (treat as invalid)
            return false
        }
    }
}
