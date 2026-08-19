import {
    Injectable,
} from "@nestjs/common"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    InjectIoRedis,
} from "@modules/lib/native/ioredis/ioredis.decorators"
import type {
    Redis,
} from "ioredis"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    createHash,
    randomInt,
} from "node:crypto"
import {
    v4 as uuidv4,
} from "uuid"
import type {
    CreateActionChallengeParams,
    CreateActionChallengeResult,
    OtpActionPayloadRecord,
    OtpBaseRecord,
    RefreshActionChallengeOtpResult,
    VerifyActionChallengeResult,
    VerifyLoginChallengeParams,
} from "./types/otp-challenge"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import type SuperJson from "superjson"

@Injectable()
/** Service for creating and verifying OTP challenges. */
export class OtpChallengeService {
    /** Prefix for OTP challenge keys in Redis. */
    private readonly keyPrefix = "auth:login_otp:challenge"
    /** Maximum number of attempts for an OTP challenge. */
    private readonly maxAttempts = 5

    /**
     * Redis owns the read/compare/mutate boundary. Keeping the whole decision
     * in one script prevents two app instances from consuming the same OTP or
     * overwriting each other's attempt counter.
     */
    private readonly verifyScript = `
local raw = redis.call("GET", KEYS[1])
if not raw then
    return {"not_found", "0"}
end

local envelope = cjson.decode(raw)
local record = envelope["json"] or envelope
if record["otpHash"] ~= ARGV[1] then
    local attempts = tonumber(record["attempts"] or 0) + 1
    record["attempts"] = attempts
    local attemptsLeft = math.max(0, tonumber(ARGV[2]) - attempts)
    if attempts >= tonumber(ARGV[2]) then
        redis.call("DEL", KEYS[1])
    else
        redis.call("SET", KEYS[1], cjson.encode(envelope), "KEEPTTL")
    end
    return {"mismatch", tostring(attemptsLeft)}
end

redis.call("DEL", KEYS[1])
return {"verified", raw}
`

    /** Rotate the code and reset attempts without reviving an expired key. */
    private readonly refreshScript = `
local raw = redis.call("GET", KEYS[1])
if not raw then
    return {"not_found"}
end

local envelope = cjson.decode(raw)
local record = envelope["json"] or envelope
record["otpHash"] = ARGV[1]
record["attempts"] = 0
redis.call("SET", KEYS[1], cjson.encode(envelope), "PX", ARGV[2])
return {"refreshed", tostring(record["email"])}
`

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
    ): OtpBaseRecord {
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
        const otp = this.generateOtp()
        const result = await this.redis.eval(
            this.refreshScript,
            1,
            key,
            this.hashOtp(
                challengeId,
                otp,
            ),
            ttlMs,
        ) as Array<string>
        if (result[0] !== "refreshed") {
            return null
        }

        return {
            otp,
            email: result[1],
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
        const result = await this.redis.eval(
            this.verifyScript,
            1,
            key,
            this.hashOtp(
                challengeId,
                otp,
            ),
            this.maxAttempts,
        ) as Array<string>
        const status = result[0]
        if (status === "not_found") {
            return {
                mismatch: false,
                attemptsLeft: 0,
                notFound: true,
            }
        }

        if (status === "mismatch") {
            return {
                mismatch: true,
                attemptsLeft: Number(result[1]),
                notFound: false,
            }
        }

        const record = this.superJson.parse<OtpActionPayloadRecord<TPayload>>(result[1])

        return {
            email: record.email,
            payload: record.payload,
            mismatch: false,
            attemptsLeft: this.maxAttempts,
            notFound: false,
        }
    }
}

