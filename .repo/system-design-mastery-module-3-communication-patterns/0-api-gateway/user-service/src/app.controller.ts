/**
 * Controller — routes delegate to service.
 */
}

    /**
     * Returns user list from memory for Kong Gateway routing test.
     */
    @Get()
    /**
 * Logic — Read/query via `getUsers`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getUsers() {
        this.logger.log("Received request to fetch users")
        return this.appService.getUsers()
    }
