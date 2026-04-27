import {
    Injectable,
} from "@nestjs/common"
import {
    InjectIoRedis,
    IoRedisInstanceKey,
} from "@modules/native"
import type {
    Redis,
} from "ioredis"
import {
    envConfig,
} from "@modules/env"
import {
    randomInt,
    createHash,
    timingSafeEqual,
} from "crypto"
import {
    v4 as uuidv4,
} from "uuid"

export interface CreateLoginChallengeParams {
    email: string
    /** Tokens obtained from Keycloak (kept server-side until OTP is verified). */
    tokenResponse: {
        access_token: string
        refresh_token: string
        token_type: string
        id_token?: string
    }
}

export interface CreateLoginChallengeResult {
    challengeId: string
    otp: string
    expiresInSeconds: number
}

export interface VerifyLoginChallengeParams {
    challengeId: string
    otp: string
}

export interface LoginChallengeTokens {
    accessToken: string
    refreshToken: string
    tokenType: string
    idToken?: string
}

type LoginChallengeRecord = {
    email: string
    otpHash: string
    attempts: number
    tokens: {
        accessToken: string
        refreshToken: string
        tokenType: string
        idToken?: string
    }
}

@Injectable()
export class OtpChallengeService {
    private static readonly KEY_PREFIX = "auth:login_otp:challenge"
    private static readonly MAX_ATTEMPTS = 5

    constructor(
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
    ) {}

    private getTtlMs(): number {
        return envConfig().cache.ttl.sendOtpCode
    }

    private buildKey(challengeId: string): string {
        return `${OtpChallengeService.KEY_PREFIX}:${challengeId}`
    }

    private generateOtp(): string {
        // crypto-secure 6-digit code (000000..999999)
        return String(randomInt(0,
            1_000_000)).padStart(6,
            "0")
    }

    private hashOtp(challengeId: string, otp: string): string {
        // Challenge-bound hash so identical OTPs across challenges don't collide
        return createHash("sha256").update(`${challengeId}:${otp}`).digest("hex")
    }

    private safeEqualsHex(a: string, b: string): boolean {
        const abuf = Buffer.from(a,
            "hex")
        const bbuf = Buffer.from(b,
            "hex")
        if (abuf.length !== bbuf.length) {
            return false
        }
        return timingSafeEqual(abuf,
            bbuf)
    }

    async createLoginChallenge(
        params: CreateLoginChallengeParams,
    ): Promise<CreateLoginChallengeResult> {
        const ttlMs = this.getTtlMs()
        const challengeId = uuidv4()
        const otp = this.generateOtp()

        const record: LoginChallengeRecord = {
            email: params.email,
            otpHash: this.hashOtp(challengeId,
                otp),
            attempts: 0,
            tokens: {
                accessToken: params.tokenResponse.access_token,
                refreshToken: params.tokenResponse.refresh_token,
                tokenType: params.tokenResponse.token_type,
                idToken: params.tokenResponse.id_token,
            },
        }

        const key = this.buildKey(challengeId)
        // Set the challenge only if it does not exist; expire automatically.
        // ioredis supports: set(key, value, 'PX', ttlMs, 'NX')
        const ok = await this.redis.set(key,
            JSON.stringify(record),
            "PX",
            ttlMs,
            "NX")

        if (ok !== "OK") {
            // Extremely unlikely given UUID keys; just retry once.
            return this.createLoginChallenge(params)
        }

        return {
            challengeId,
            otp,
            expiresInSeconds: Math.max(1,
                Math.floor(ttlMs / 1000)),
        }
    }

    /**
     * Verify OTP and return stored Keycloak tokens. Single-use on success.
     *
     * @returns tokens when verified, or `null` if challenge missing/expired.
     * @throws Error when OTP mismatches too many times.
     */
    async verifyLoginChallenge(
        params: VerifyLoginChallengeParams,
    ): Promise<{
        email: string
        tokens: LoginChallengeTokens
        mismatch: boolean
        attemptsLeft: number
        notFound: boolean
    }> {
        const key = this.buildKey(params.challengeId)
        const raw = await this.redis.get(key)
        if (!raw) {
            return {
                email: "",
                tokens: {
                    accessToken: "",
                    refreshToken: "",
                    tokenType: "",
                },
                mismatch: false,
                attemptsLeft: 0,
                notFound: true,
            }
        }

        const record = JSON.parse(raw) as LoginChallengeRecord
        const expectedHash = record.otpHash
        const actualHash = this.hashOtp(params.challengeId,
            params.otp)

        const matches = this.safeEqualsHex(expectedHash,
            actualHash)
        if (!matches) {
            const attempts = (record.attempts ?? 0) + 1
            record.attempts = attempts
            await this.redis.set(key,
                JSON.stringify(record),
                "KEEPTTL")

            const attemptsLeft = Math.max(0,
                OtpChallengeService.MAX_ATTEMPTS - attempts)
            if (attempts >= OtpChallengeService.MAX_ATTEMPTS) {
                await this.redis.del(key)
            }

            return {
                email: record.email,
                tokens: {
                    accessToken: "",
                    refreshToken: "",
                    tokenType: "",
                },
                mismatch: true,
                attemptsLeft,
                notFound: false,
            }
        }

        await this.redis.del(key)

        return {
            email: record.email,
            tokens: record.tokens,
            mismatch: false,
            attemptsLeft: OtpChallengeService.MAX_ATTEMPTS,
            notFound: false,
        }
    }
}

