import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CvEvidenceLevel,
} from "@modules/databases/postgresql/primary/enums/cv-evidence-level"
import type {
    CvEvidenceSnapshot,
    CvSelectedCapstoneEvidence,
} from "@modules/databases/postgresql/primary/types/cv-evidence-snapshot"
import {
    CvEvidenceSelectionInvalidException,
} from "@modules/platform/exceptions/errors/cv/cv-evidence-selection-invalid"
import type {
    ListPickableCvEvidenceParams,
    ResolveSelectedCvEvidenceParams,
    ResolveSelectedCvEvidenceResult,
} from "./types/cv-evidence"
import {
    CvEvidenceInvalidReason,
} from "./types/cv-evidence"

interface CvEvidenceRow {
    milestone_task_attempt_id: string
    milestone_task_id: string
    milestone_id: string
    course_id: string
    task_title: string
    milestone_title: string
    course_title: string
    score: number | string
    passed_at: Date | string
    passed: boolean
    user_id: string
}

@Injectable()
/** Lists and resolves only authoritative, caller-owned passed capstones for CV use. */
export class CvEvidenceService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    async listPickable({ userId }: ListPickableCvEvidenceParams): Promise<CvEvidenceSnapshot> {
        const rows = await this.loadRows(userId)
        return rows.map((row) => this.toSnapshotItem(row))
    }

    async resolveSelected({
        userId,
        milestoneTaskAttemptIds,
    }: ResolveSelectedCvEvidenceParams): Promise<ResolveSelectedCvEvidenceResult> {
        if (milestoneTaskAttemptIds.length === 0) {
            return {
                snapshot: [],
            }
        }

        const seen = new Set<string>()
        const duplicates = milestoneTaskAttemptIds.filter((id) => {
            if (seen.has(id)) {
                return true
            }
            seen.add(id)
            return false
        })
        if (duplicates.length > 0) {
            throw new CvEvidenceSelectionInvalidException({
                invalid: duplicates.map((milestoneTaskAttemptId) => ({
                    milestoneTaskAttemptId,
                    reason: CvEvidenceInvalidReason.Duplicate,
                })),
            })
        }

        const rows = await this.loadRows(undefined,
            milestoneTaskAttemptIds)
        const rowsById = new Map(rows.map((row) => [row.milestone_task_attempt_id,
            row]))
        const invalid = milestoneTaskAttemptIds.flatMap((milestoneTaskAttemptId) => {
            const row = rowsById.get(milestoneTaskAttemptId)
            if (!row) {
                return [{
                    milestoneTaskAttemptId,
                    reason: CvEvidenceInvalidReason.Missing,
                }]
            }
            if (row.user_id !== userId) {
                return [{
                    milestoneTaskAttemptId,
                    reason: CvEvidenceInvalidReason.Foreign,
                }]
            }
            if (!row.passed) {
                return [{
                    milestoneTaskAttemptId,
                    reason: CvEvidenceInvalidReason.Failed,
                }]
            }
            return []
        })
        if (invalid.length > 0) {
            throw new CvEvidenceSelectionInvalidException({
                invalid,
            })
        }

        return {
            snapshot: milestoneTaskAttemptIds.map((id) => this.toSnapshotItem(rowsById.get(id)!)),
        }
    }

    parseSnapshot(raw: unknown): CvEvidenceSnapshot {
        if (!Array.isArray(raw)) {
            return []
        }
        return raw.filter((item): item is CvSelectedCapstoneEvidence => this.isSnapshotItem(item))
            .map((item) => ({
                ...item,
            }))
    }

    evidenceLevel(raw: unknown): CvEvidenceLevel {
        return this.parseSnapshot(raw).length > 0
            ? CvEvidenceLevel.CapstoneVerified
            : CvEvidenceLevel.SelfReported
    }

    private async loadRows(
        userId?: string,
        milestoneTaskAttemptIds?: Array<string>,
    ): Promise<Array<CvEvidenceRow>> {
        const filters: Array<string> = []
        const params: Array<string | Array<string>> = []
        if (userId !== undefined) {
            params.push(userId)
            filters.push(`e.user_id = $${params.length}`)
            filters.push("mta.passed = true")
        }
        if (milestoneTaskAttemptIds !== undefined) {
            params.push(milestoneTaskAttemptIds)
            filters.push(`mta.id = ANY($${params.length}::uuid[])`)
        }
        return this.entityManager.query(
            `
            SELECT mta.id AS milestone_task_attempt_id,
                   mt.id AS milestone_task_id,
                   m.id AS milestone_id,
                   c.id AS course_id,
                   mt.title AS task_title,
                   m.title AS milestone_title,
                   c.title AS course_title,
                   mta.score AS score,
                   COALESCE(mta.processed_at, mta.created_at) AS passed_at,
                   mta.passed AS passed,
                   e.user_id AS user_id
            FROM user_milestone_task_attempts mta
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
            JOIN milestones m ON m.id = mt.milestone_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            JOIN courses c ON c.id = e.course_id
            ${filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY mta.created_at DESC
            `,
            params,
        ) as Promise<Array<CvEvidenceRow>>
    }

    private toSnapshotItem(row: CvEvidenceRow): CvSelectedCapstoneEvidence {
        return {
            milestoneTaskAttemptId: row.milestone_task_attempt_id,
            milestoneTaskId: row.milestone_task_id,
            milestoneId: row.milestone_id,
            courseId: row.course_id,
            taskTitle: row.task_title,
            milestoneTitle: row.milestone_title,
            courseTitle: row.course_title,
            score: Number(row.score ?? 0),
            passedAt: new Date(row.passed_at).toISOString(),
        }
    }

    private isSnapshotItem(raw: unknown): raw is CvSelectedCapstoneEvidence {
        if (!raw || typeof raw !== "object") {
            return false
        }
        const item = raw as Record<string, unknown>
        return [
            "milestoneTaskAttemptId",
            "milestoneTaskId",
            "milestoneId",
            "courseId",
            "taskTitle",
            "milestoneTitle",
            "courseTitle",
            "passedAt",
        ].every((key) => typeof item[key] === "string" && item[key] !== "")
            && typeof item.score === "number"
            && Number.isFinite(item.score)
            && !Number.isNaN(Date.parse(item.passedAt as string))
    }
}
