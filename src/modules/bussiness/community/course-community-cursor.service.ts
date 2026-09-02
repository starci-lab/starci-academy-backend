import {
    Injectable
} from "@nestjs/common"
import {
    createHmac, timingSafeEqual
} from "node:crypto"
import {
    envConfig
} from "@modules/platform/env/config"
import {
    CourseCommunityCursorException
} from "@modules/platform/exceptions/errors/community/course-community"

interface CursorPayload { v: 1; courseId: string; mine: boolean; queryHash: string; createdAt: string; id: string }

@Injectable()
/**
 * Signs and verifies the opaque pagination cursor used by course community
 * feed/comment queries. Reach for this instead of exposing raw offsets or
 * ids, so a cursor cannot be forged or replayed against a different query.
 */
export class CourseCommunityCursorService {
    private secret(): string {
        const value = envConfig().community.courseCommunityCursorSecret
        if (!value || value.length < 32) throw new CourseCommunityCursorException({
        })
        return value
    }

    queryHash(query?: string | null): string {
        return createHmac("sha256",
            this.secret()).update((query ?? "").trim().toLocaleLowerCase()).digest("hex")
    }

    encode(payload: Omit<CursorPayload, "v">): string {
        const body = Buffer.from(JSON.stringify({
            v: 1, ...payload
        } satisfies CursorPayload)).toString("base64url")
        const signature = createHmac("sha256",
            this.secret()).update(body).digest("base64url")
        return `${body}.${signature}`
    }

    decode(cursor: string, expected: Pick<CursorPayload, "courseId" | "mine" | "queryHash">): CursorPayload {
        const [body,
            supplied] = cursor.split(".")
        let payload: CursorPayload
        try {
            const actual = createHmac("sha256",
                this.secret()).update(body).digest()
            const candidate = Buffer.from(supplied,
                "base64url")
            if (candidate.length !== actual.length || !timingSafeEqual(candidate,
                actual)) throw new CourseCommunityCursorException({
            })
            payload = JSON.parse(Buffer.from(body,
                "base64url").toString("utf8")) as CursorPayload
        } catch (error) {
            if (error instanceof CourseCommunityCursorException) throw error
            throw new CourseCommunityCursorException({
                originalError: error as Error
            })
        }
        if (payload.v !== 1 || payload.courseId !== expected.courseId || payload.mine !== expected.mine || payload.queryHash !== expected.queryHash || !payload.id || Number.isNaN(Date.parse(payload.createdAt))) throw new CourseCommunityCursorException({
        })
        return payload
    }
}
