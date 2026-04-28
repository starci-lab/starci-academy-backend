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
    timingSafeEqual,
} from "crypto"
import {
    nanoid,
} from "nanoid"
import {
    v4 as uuidv4,
} from "uuid"
import type {
    CreateLoginChallengeParams,
    CreateLoginChallengeResult,
    LoginChallengeRecord,
    VerifyLoginChallengeParams,
    VerifyLoginChallengeResult,
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

    /** Generate a cryptographically secure OTP code. */
    private generateOtp(): string {
        // crypto-secure 6-digit code (000000..999999)
        return nanoid(6)
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

    /** Create a new OTP challenge. */
    async createLoginChallenge(
        params: CreateLoginChallengeParams,
    ): Promise<CreateLoginChallengeResult> {
        /** Get the TTL in milliseconds for the challenge. */
        const ttlMs = this.getTtlMs()
        /** Generate a unique challenge ID. */
        const challengeId = uuidv4()
        /** Generate a new OTP. */
        const otp = this.generateOtp()
        /** Create a new login challenge record. */
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
        /** Build the key for the challenge in Redis. */
        const key = this.buildKey(challengeId)
        // Set the challenge only if it does not exist; expire automatically.
        // ioredis supports: set(key, value, 'PX', ttlMs, 'NX')
        /** Set the challenge in Redis. */
        const ok = await this.redis.set(key,
            JSON.stringify(record),
            "PX",
            ttlMs,
            "NX")

        /** If the challenge was not set, retry. */
        if (ok !== "OK") {
            // Extremely unlikely given UUID keys; just retry once.
            return this.createLoginChallenge(params)
        }

        /** Return the challenge result. */
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
        {
            challengeId,
            otp,
        }: VerifyLoginChallengeParams,
    ): Promise<VerifyLoginChallengeResult> {
        /** Build the key for the OTP challenge in Redis. */
        const key = this.buildKey(
            challengeId
        )
        /** Get the raw data from Redis. */
        const data = await this.redis.get(key)
        /** If the challenge is not found, return a failure result. */
        if (!data) {
            return {
                mismatch: false,
                attemptsLeft: 0,
                notFound: true,
            }
        }
        /** Parse the data from Redis into a LoginChallengeRecord. */
        const record = this.superJson.parse<LoginChallengeRecord>(data)
        /** Calculate the expected hash for the OTP. */
        const expectedHash = record.otpHash
        /** Calculate the actual hash for the OTP. */
        const actualHash = this.hashOtp(
            challengeId,
            otp
        )
        /** Check if the expected hash matches the actual hash. */
        const matches = this.safeEqualsHex(expectedHash,
            actualHash)
        if (!matches) {
            /** Increment the number of attempts. */
            const attempts = (record.attempts ?? 0) + 1
            record.attempts = attempts
            /** Save the updated record back to Redis. */
            await this.redis.set(
                key,
                this.superJson.stringify(record),
                "KEEPTTL"
            )
            /** Calculate the number of attempts left. */
            const attemptsLeft = Math.max(0,
                this.maxAttempts - attempts)
            if (attempts >= this.maxAttempts) {
                /** Delete the challenge from Redis. */
                await this.redis.del(key)
            }

            return {
                mismatch: true,
                attemptsLeft,
                notFound: true,
            }
        }

        /** Delete the challenge from Redis. */
        await this.redis.del(key)

        return {
            email: record.email,
            tokens: record.tokens,
            mismatch: false,
            attemptsLeft: this.maxAttempts,
            notFound: false,
        }
    }
}

