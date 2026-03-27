import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    GithubRepoLoader,
} from "@langchain/community/document_loaders/web/github"
import type {
    Document,
} from "@langchain/core/documents"

export interface ProccessGitUrlLoadDocsStepParams {
    githubUrl: string
    branch?: string
}

export type ProccessGitUrlLoadDocsStepResult = Document[]

@Injectable()
export class ProccessGitUrlLoadDocsStepService {
    async execute({
        githubUrl,
        branch,
    }: ProccessGitUrlLoadDocsStepParams): Promise<ProccessGitUrlLoadDocsStepResult> {
        const githubWorkerConfig = envConfig().services.githubWorker.processGitUrl
        const gitLoader = new GithubRepoLoader(
            githubUrl,
            {
                branch: branch ?? githubWorkerConfig.branch,
                recursive: true,
                accessToken: githubWorkerConfig.githubAccessToken,
                verbose: true,
                ignorePaths: [
                    "package-lock.json",
                    "dist",
                    "node_modules",
                ],
            },
        )
        return gitLoader.load()
    }
}
