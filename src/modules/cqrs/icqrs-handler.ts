/**
 * Interface for a CQRS handler.
 * @template TParams - The parameters type.
 * @template TResponse - The response type.
 */
export abstract class ICQRSHandler<TParams, TResponse = unknown> {
    /**
     * Execute the handler.
     * @returns The response.
     */
    async execute(params: TParams): Promise<TResponse> {
        await this.validate(params)
        const response = await this.process(params)
        await this.emit(params,
            response)
        return response
    }

    /**
     * Validate the request.
     * @returns void.
     */
    protected async validate(params: TParams): Promise<void> {
        void params
    }

    /**
     * Process the request.
     * @param params - The parameters.
     * @returns The response.
     */
    protected abstract process(params: TParams): Promise<TResponse>

    /**
     * Emit the response.
     * @param request - The request.
     * @param response - The response.
     * @returns void.
     */
    protected async emit(request: TParams, response: TResponse): Promise<void> {
        void request
        void response
    }
}
