/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * GET /process/1-clarify — Bước 1: Làm rõ yêu cầu.
     * (EN: GET /process/1-clarify — Step 1: Clarify requirements.)
     */
    @Get("1-clarify")
    clarify(@Query("name") name: string = "URL Shortener"): ReturnType<ProcessService["clarify"]> {
        return this.processService.clarify(name)
    }

    /**
     * GET /process/2-estimate — Bước 2: Ước lượng quy mô.
     * (EN: GET /process/2-estimate — Step 2: Estimate scale.)
     */
    @Get("2-estimate")
    estimate(@Query("newUrls") newUrls: string = "100000000"): ReturnType<ProcessService["estimate"]> {
        return this.processService.estimate(parseInt(newUrls, 10))
    }

    /**
     * GET /process/3-design — Bước 3: Thiết kế kiến trúc tổng thể.
     * (EN: GET /process/3-design — Step 3: High-level design.)
     */
    @Get("3-design")
    /**
 * Logic — Xử lý nghiệp vụ `design` cho lab.
 * Code — `design()` — logic trong service/controller.
 * (EN Logic: Business handler `design` for the lab.)
 * (EN Code: `design()` — in-class handler logic.)
 */
    design(): ReturnType<ProcessService["getHighLevelDesign"]> {
        return this.processService.getHighLevelDesign()
    }

    /**
     * GET /process/4-deep-dive — Bước 4: Tinh chỉnh chi tiết.
     * (EN: GET /process/4-deep-dive — Step 4: Deep dive.)
     */
    @Get("4-deep-dive")
    /**
 * Logic — Xử lý nghiệp vụ `deepDive` cho lab.
 * Code — `deepDive()` — logic trong service/controller.
 * (EN Logic: Business handler `deepDive` for the lab.)
 * (EN Code: `deepDive()` — in-class handler logic.)
 */
    deepDive(): ReturnType<ProcessService["deepDive"]> {
        return this.processService.deepDive()
    }
