/**
 * Controller — routes delegate to service.
 */
}

    /**
     * GET /api/payment — Handles mock payment processing.
     */
    @Get()
    /**
 * Logic — Read/query via `getPayment`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getPayment() {
        return {
            service: "Payment Service",
            hostname: os.hostname(),
            timestamp: new Date().toISOString(),
            status: "Ready to process payments",
        }
    }
