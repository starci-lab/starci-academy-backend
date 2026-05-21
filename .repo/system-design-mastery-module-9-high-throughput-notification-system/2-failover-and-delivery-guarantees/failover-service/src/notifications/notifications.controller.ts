/**
 * Logic — Đọc/truy vấn dữ liệu qua `findAll`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `findAll`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async findAll() { return this.service.findAll() }

    /**
 * Logic — Xử lý nghiệp vụ `queueStatus` cho lab.
 * Code — `async queueStatus()` — gọi dependency inject / client.
 * (EN Logic: Business handler `queueStatus` for the lab.)
 * (EN Code: `async queueStatus()` — uses injected deps / clients.)
 */
    async queueStatus() { return this.service.getQueueStatus() }

    /**
 * Logic — Xử lý nghiệp vụ `dlq` cho lab.
 * Code — `async dlq()` — gọi dependency inject / client.
 * (EN Logic: Business handler `dlq` for the lab.)
 * (EN Code: `async dlq()` — uses injected deps / clients.)
 */
    async dlq() { return this.service.getDlqJobs() }
