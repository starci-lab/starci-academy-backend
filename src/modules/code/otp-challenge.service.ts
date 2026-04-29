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
    createHash,
    randomInt,
    timingSafeEqual,
} from "crypto"
import {
    v4 as uuidv4,
} from "uuid"
import type {
    CreateActionChallengeParams,
    CreateActionChallengeResult,
    OtpActionPayloadRecord,
    RefreshActionChallengeOtpResult,
    VerifyActionChallengeResult,
    VerifyLoginChallengeParams,
} from "./types"
import { 
    InjectSuperJson 
} from "@modules/mixin"
import type SuperJson from "superjson"

/** Service for creating and verifying OTP challenges. */
@Injectable()
export class OtpChallengeService {
    /** Prefix for OTP challenge keys in Redis. */
    private readonly keyPrefix = "auth:login_otp:challenge"
    /** Maximum number of attempts for an OTP challenge. */
    private readonly maxAttempts = 5

    constructor(
        @InjectIoRedis(IoRedisInstanceKey.Cache)
        private readonly redis: Redis,
        @InjectSuperJson()
        private readonly superJson: SuperJson,
    ) {}

    /** Get the TTL in milliseconds for an OTP challenge. */
    private getTtlMs(): number {
        return envConfig().cache.ttl.sendOtpCode
    }

    /** Build the key for an OTP challenge in Redis. */
    private buildKey(challengeId: string): string {
        return `${this.keyPrefix}:${challengeId}`
    }

    /** Build a base record for OTP challenges. */
    private buildBaseRecord(
        challengeId: string,
        email: string,
        otp: string,
    ): {
        email: string
        otpHash: string
        attempts: number
    } {
        return {
            email,
            otpHash: this.hashOtp(
                challengeId,
                otp,
            ),
            attempts: 0,
        }
    }

    /** Generate a 6-digit OTP code. */
    private generateOtp(): string {
        return randomInt(0,
            1000000)
            .toString()
            .padStart(
                6,
                "0"
            )
    }

    /** Hash the OTP for the challenge. */
    private hashOtp(challengeId: string, otp: string): string {
        // Challenge-bound hash so identical OTPs across challenges don't collide
        return createHash("sha256").update(`${challengeId}:${otp}`).digest("hex")
    }

    /** Compare two hexadecimal strings safely. */
    private safeEqualsHex(
        a: string, 
        b: string
    ): boolean {
        const abuf = Buffer.from(
            a,
            "hex")
        const bbuf = Buffer.from(
            b,
            "hex")
        /** If the lengths of the buffers are not equal, return false. */
        if (abuf.length !== bbuf.length) {
            return false
        }
        /** Compare the buffers safely. */
        return timingSafeEqual(
            abuf,
            bbuf
        )
    }

    /**
     * Create an OTP challenge that stores arbitrary payload until verification.
     */
    async createActionChallenge<TPayload>(
        params: CreateActionChallengeParams<TPayload>,
    ): Promise<CreateActionChallengeResult> {
        const ttlMs = this.getTtlMs()
        const challengeId = uuidv4()
        const otp = this.generateOtp()

        const record: OtpActionPayloadRecord<TPayload> = {
            ...this.buildBaseRecord(
                challengeId,
                params.email,
                otp,
            ),
            payload: params.payload,
        }

        const key = this.buildKey(challengeId)
        const ok = await this.redis.set(
            key,
            this.superJson.stringify(record),
            "PX",
            ttlMs,
            "NX"
        )
        if (ok !== "OK") {
            return this.createActionChallenge(params)
        }

        return {
            challengeId,
            otp,
            expiresInSeconds: Math.max(
                1,
                Math.floor(ttlMs / 1000)
            ),
        }
    }

    /**
     * Rotates the OTP for an existing challenge, resets attempt count, and extends the TTL.
     * Payload and email are unchanged. Returns null if the challenge is missing or expired.
     */
    async refreshActionChallengeOtp(
        challengeId: string,
    ): Promise<RefreshActionChallengeOtpResult | null> {
        const ttlMs = this.getTtlMs()
        const key = this.buildKey(challengeId)
        const data = await this.redis.get(key)
        if (!data) {
            return null
        }

        const record = this.superJson.parse<OtpActionPayloadRecord<unknown>>(data)
        const otp = this.generateOtp()
        record.otpHash = this.hashOtp(
            challengeId,
            otp,
        )
        record.attempts = 0

        await this.redis.set(
            key,
            this.superJson.stringify(record),
            "PX",
            ttlMs,
        )

        return {
            otp,
            email: record.email,
            expiresInSeconds: Math.max(
                1,
                Math.floor(ttlMs / 1000)
            ),
        }
    }

    /**
     * Verify OTP and return stored payload. Single-use on success.
     */
    async verifyActionChallenge<TPayload>(
        {
            challengeId,
            otp,
        }: VerifyLoginChallengeParams,
    ): Promise<VerifyActionChallengeResult<TPayload>> {
        const key = this.buildKey(
            challengeId
        )
        const data = await this.redis.get(key)
        if (!data) {
            return {
                mismatch: false,
                attemptsLeft: 0,
                notFound: true,
            }
        }

        const record = this.superJson.parse<OtpActionPayloadRecord<TPayload>>(data)
        const expectedHash = record.otpHash
        const actualHash = this.hashOtp(
            challengeId,
            otp
        )
        const matches = this.safeEqualsHex(
            expectedHash,
            actualHash
        )

        if (!matches) {
            const attempts = (record.attempts ?? 0) + 1
            record.attempts = attempts
            await this.redis.set(
                key,
                this.superJson.stringify(record),
                "KEEPTTL"
            )
            const attemptsLeft = Math.max(
                0,
                this.maxAttempts - attempts
            )
            if (attempts >= this.maxAttempts) {
                await this.redis.del(key)
            }

            return {
                mismatch: true,
                attemptsLeft,
                notFound: false,
            }
        }

        await this.redis.del(key)

        return {
            email: record.email,
            payload: record.payload,
            mismatch: false,
            attemptsLeft: this.maxAttempts,
            notFound: false,
        }
    }
}

