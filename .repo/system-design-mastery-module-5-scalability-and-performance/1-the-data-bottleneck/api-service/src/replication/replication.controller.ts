/**
 * HTTP controller — route demo, delegate sang service.
 * (EN: HTTP controller — demo routes delegating to service.)
 */
import {
    Controller, Get 
} from "@nestjs/common"
import {
    DataSource 
} from "typeorm"

function normalizePgBool(value): boolean {/**
 * Logic — Xử lý nghiệp vụ `if` cho lab.
 * Code — `if()` — logic trong service/controller.
 * (EN Logic: Business handler `if` for the lab.)
 * (EN Code: `if()` — in-class handler logic.)
 */
    if (value === true || value === "t") {
        return true
    }/**
 * Logic — Xử lý nghiệp vụ `if` cho lab.
 * Code — `if()` — logic trong service/controller.
 * (EN Logic: Business handler `if` for the lab.)
 * (EN Code: `if()` — in-class handler logic.)
 */
    if (value === false || value === "f") {}

    /**
     * So sánh pg_is_in_recovery trên master vs một kết nối replica (minh hoạ lab).
     * EN: Compare recovery flags on master vs read pool (teaching aid).
     */
    @Get("replication")/**
 * Logic — Xử lý nghiệp vụ `replication` cho lab.
 * Code — `async replication()` — gọi dependency inject / client.
 * (EN Logic: Business handler `replication` for the lab.)
 * (EN Code: `async replication()` — uses injected deps / clients.)
 */
    async replication(): Promise<{
        masterPgIsInRecovery: boolean
        sampleReadPoolPgIsInRecovery: boolean
    }> {
        const masterRunner = this.dataSource.createQueryRunner("master")
        await masterRunner.connect()
        let masterRec = false
        try {
            const rows = await masterRunner.query(
                "SELECT pg_is_in_recovery() AS recovering",
            )
            masterRec = normalizePgBool(rows[0]?.recovering)
        } finally {
            await masterRunner.release()
        }

        const slaveRunner = this.dataSource.createQueryRunner("slave")
        await slaveRunner.connect()
        let slaveRec = false
        try {
            const rows = await slaveRunner.query(
                "SELECT pg_is_in_recovery() AS recovering",
            )
            slaveRec = normalizePgBool(rows[0]?.recovering)
        } finally {
            await slaveRunner.release()
        }

        return {
            masterPgIsInRecovery: masterRec,
            sampleReadPoolPgIsInRecovery: slaveRec,
        }
    }
}
