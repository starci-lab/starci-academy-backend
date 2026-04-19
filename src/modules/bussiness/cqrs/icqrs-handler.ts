export abstract class ICqrsHandler<TResponse = unknown> {
    async execute(): Promise<TResponse> {
        await this.validate()
        const response = await this.process()
        await this.emit(response)
        return response
    }

    protected async validate(): Promise<void> {}

    protected abstract process(): Promise<TResponse>

    protected async emit(response: TResponse): Promise<void> {
        void response
    }
}
