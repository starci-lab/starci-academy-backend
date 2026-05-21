/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * POST /transfer — Thực hiện chuyển tiền (Ghi dữ liệu).
     * (EN: POST /transfer — Perform money transfer (Write data).)
     */
    @Post("transfer")
    async transfer(@Body("amount") amount: string): Promise<TransferResponse> {
        const val = parseInt(amount, 10)
        if (isNaN(val)) {
            throw new HttpException("Invalid amount", HttpStatus.BAD_REQUEST)
        }
        return await this.nodeService.transfer(val)
    }

    /**
     * GET /balance — Truy vấn số dư (Đọc dữ liệu).
     * (EN: GET /balance — Query balance (Read data).)
     */
    @Get("balance")
    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getBalance`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getBalance`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    getBalance(): BalanceResponse {
        return this.nodeService.getBalance()
    }

    /**
     * POST /internal/sync — Endpoint nội bộ để đồng bộ dữ liệu giữa các node.
     * (EN: POST /internal/sync — Internal endpoint to sync data between nodes.)
     */
    @Post("internal/sync")
    sync(@Body("amount") amount: number): SyncResponse {
        return this.nodeService.applySync(amount)
    }
