export class Sepay {
    public readonly apiKey: string
    
    constructor(options: { apiKey: string }) {
        this.apiKey = options.apiKey
    }
}
