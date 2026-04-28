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
        return await this.process(params)
    }

    protected abstract process(params: TParams): Promise<TResponse>
}
