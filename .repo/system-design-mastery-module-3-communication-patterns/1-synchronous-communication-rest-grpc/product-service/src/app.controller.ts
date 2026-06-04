/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives gRPC `GetProduct` request, returns product from memory.
     * Code — `@GrpcMethod` maps to `ProductService.GetProduct` in proto.
     */
    @GrpcMethod("ProductService", "GetProduct")/**
 * Logic — Read/query via `getProduct`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getProduct(data: { id: number }) {
        this.logger.log(`gRPC GetProduct id=${data.id}`)
        return this.appService.getProduct(data.id)
    }
