import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import type {
    Document,
} from "@langchain/core/documents"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"

export interface ProccessGitUrlSplitDocsStepParams {
    docs: Document[]
}

export type ProccessGitUrlSplitDocsStepResult = Document[]

@Injectable()
export class ProccessGitUrlSplitDocsStepService {
    async execute({
        docs,
    }: ProccessGitUrlSplitDocsStepParams): Promise<ProccessGitUrlSplitDocsStepResult> {
        const githubWorkerConfig = envConfig().services.githubWorker.processGitUrl
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: githubWorkerConfig.chunkSize,
            chunkOverlap: githubWorkerConfig.chunkOverlap,
        })
        return splitter.splitDocuments(docs)
    }
}
