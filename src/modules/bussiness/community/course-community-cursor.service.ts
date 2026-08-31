import { Injectable } from "@nestjs/common"
import { createHmac, timingSafeEqual } from "node:crypto"
import { CourseCommunityCursorException } from "@modules/platform/exceptions/errors/community/course-community"

interface CursorPayload { v: 1; courseId: string; mine: boolean; queryHash: string; createdAt: string; id: string }

@Injectable()
export class CourseCommunityCursorService {
    private secret(): string {
        const value = process.env.COURSE_COMMUNITY_CURSOR_SECRET
        if (!value || value.length < 32) throw new CourseCommunityCursorException()
        return value
    }

    queryHash(query?: string | null): string {
        return createHmac("sha256", this.secret()).update((query ?? "").trim().toLocaleLowerCase()).digest("hex")
    }

    encode(payload: Omit<CursorPayload, "v">): string {
        const body = Buffer.from(JSON.stringify({ v: 1, ...payload } satisfies CursorPayload)).toString("base64url")
        const signature = createHmac("sha256", this.secret()).update(body).digest("base64url")
        return `${body}.${signature}`
    }

    decode(cursor: string, expected: Pick<CursorPayload, "courseId" | "mine" | "queryHash">): CursorPayload {
        try {
            const [body, supplied] = cursor.split(".")
            const actual = createHmac("sha256", this.secret()).update(body).digest()
            const candidate = Buffer.from(supplied, "base64url")
            if (candidate.length !== actual.length || !timingSafeEqual(candidate, actual)) throw new Error("signature")
            const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CursorPayload
            if (payload.v !== 1 || payload.courseId !== expected.courseId || payload.mine !== expected.mine || payload.queryHash !== expected.queryHash || !payload.id || Number.isNaN(Date.parse(payload.createdAt))) throw new Error("binding")
            return payload
        } catch (error) {
            throw new CourseCommunityCursorException({ originalError: error as Error })
        }
    }
}
