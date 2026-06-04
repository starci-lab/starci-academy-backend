/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Logic — Receives gRPC `GetUser` request, returns user from memory.
     * Code — `@GrpcMethod` maps to `UserService.GetUser` in proto.
     */
    @GrpcMethod("UserService", "GetUser")/**
 * Logic — Read/query via `getUser`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getUser(data: { id: number }) {
        this.logger.log(`gRPC GetUser id=${data.id}`)
        return this.appService.getUser(data.id)
    }
