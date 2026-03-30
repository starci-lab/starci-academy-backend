import {
    InjectQdrantClient,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import type {
    Document,
} from "@langchain/core/documents"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai"

export interface ProccessGitUrlVectorizeStepParams {
    chunks: Document[]
    collectionName?: string
}

@Injectable()
export class ProccessGitUrlVectorizeStepService {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
    ) {}

    async execute({
        chunks,
        collectionName,
    }: ProccessGitUrlVectorizeStepParams): Promise<void> {
        const githubWorkerConfig = envConfig().services.githubWorker.processGitUrl
        await QdrantVectorStore.fromDocuments(
            chunks,
            new GoogleGenerativeAIEmbeddings({
                model: githubWorkerConfig.embeddingModel,
                apiKey: githubWorkerConfig.genAiApiKey,
            }),
            {
                client: this.qdrantClient,
                collectionName: collectionName ?? githubWorkerConfig.collectionName,
            },
        )
    }
}
