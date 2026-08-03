export interface NatsConsumerOpenedMessage {
    subjects: Array<string>
}

export interface NatsConsumerClosedMessage {
    subjects: Array<string>
    durationMs: number | null
}

export interface NatsConsumerErrorMessage {
    subjects: Array<string>
    error: string
    stack?: string
}

