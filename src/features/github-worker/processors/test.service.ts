import {
    InjectQdrantClient 
} from "@modules/databases"
import {
    Injectable, 
    OnApplicationBootstrap
} from "@nestjs/common"
import {
    QdrantClient 
} from "@qdrant/qdrant-js"
import {
    GithubRepoLoader 
} from "@langchain/community/document_loaders/web/github"
import {
    RecursiveCharacterTextSplitter 
} from "langchain/text_splitter"
import {
    QdrantVectorStore 
} from "@langchain/qdrant"
import {
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings 
} from "@langchain/google-genai"
import {
    createRetrievalChain 
} from "langchain/chains/retrieval"
import {
    ChatPromptTemplate 
} from "@langchain/core/prompts"
import {
    createStuffDocumentsChain 
} from "langchain/chains/combine_documents"


@Injectable()
export class TestService implements OnApplicationBootstrap {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
    ) {}

    onApplicationBootstrap() {
        this.test()
    }

    /**
     * Test the service.
     * @returns The test result.
     */
    async test() {
        // get the github repositories
        // const githubUrl = "https://github.com/starci-lab/starci-academy-backend.git"
        // get git loader
        const gitLoader = new GithubRepoLoader(
            "https://github.com/StarCi-Academy/k8s-pod",
            {
                branch: "main",
                recursive: true,
                accessToken: "",
                verbose: true,
                ignorePaths: [
                    "package-lock.json",
                    "dist",
                    "node_modules"
                ],
            }
        )
        // load the repository
        const docs = await gitLoader.load()
        console.log(docs.length)
        // split the documents
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        })
        const chunks = await splitter.splitDocuments(docs)
        console.log(chunks.length)
        const vectorStore = await QdrantVectorStore.fromDocuments(
            chunks,
            new GoogleGenerativeAIEmbeddings({
                model: "gemini-embedding-001",
                apiKey: "",
            }),
            {
                client: this.qdrantClient,
                collectionName: "test-google-genai",
            }
        )
        const retriever = vectorStore.asRetriever()
        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            temperature: 0,
            apiKey: "",
        })
        const prompt = ChatPromptTemplate.fromTemplate(`
            You are a principle engineer.
            
            Use the following context to answer the question.
            
            Context:
            {context}
            
            Question:
            {input}
            
            Answer clearly with explanation and file references if possible.
            `)
        const combineDocsChain = await createStuffDocumentsChain({
            llm,
            prompt,
        })
        const chain = await createRetrievalChain(
            {
                retriever,
                combineDocsChain,
            }
        )
        const result = await chain.invoke({
            input: "Does this repo use JWT authentication?",
        }) 
        console.log(result)
    }
}