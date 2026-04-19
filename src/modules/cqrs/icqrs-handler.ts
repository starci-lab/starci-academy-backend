/**
 * Interface for a CQRS handler.
 * @template TResponse - The response type.
 */
export abstract class ICQRSHandler<TResponse = unknown> {
    /**
     * Execute the handler.
     * @returns The response.
     */
    async execute(): Promise<TResponse> {
        await this.validate()
        const response = await this.process()
        await this.emit(response)
        return response
    }

    /**
     * Validate the request.
     * @returns void.
     */
    protected async validate(): Promise<void> {}

    /**
     * Process the request.
     * @returns The response.
     */
    protected abstract process(): Promise<TResponse>

    /**
     * Emit the response.
     * @param response - The response.
     * @returns void.
     */
    protected async emit(response: TResponse): Promise<void> {
        void response
    }
}
