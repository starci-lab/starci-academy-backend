/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

  /**
   * Endpoint scrape Prometheus: body = `await register.metrics()`, header = `register.contentType` (EN: scrape endpoint per prom-client README).
   */
  @Get()
    async metrics(@Res({
        passthrough: true 
    }) res: Response): Promise<string> {
    // Đặt Content-Type đúng loại registry (Prometheus vs OpenMetrics) (EN: set Content-Type for registry format).
        res.setHeader("Content-Type",
            this.metricsService.expositionContentType)
        return await this.metricsService.metricsText()
    }
}
