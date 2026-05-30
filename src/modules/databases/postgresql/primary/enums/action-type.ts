import {
    createEnumType 
} from "@modules/common/utils/enum"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * The type of action performed on a preflight transaction.
 */
export enum ActionType {
    /**
     * The action type for a course enrollment.
     */
    Enroll = "enroll",
    /**
     * Grade a learner GitHub submission (worker pipeline).
     */
    ProcessGitSubmission = "processGitSubmission",
    /**
     * Grade a SCHEMA V2 learner GitHub submission against outcome/approach criteria.
     */
    ProcessGitSubmissionV2 = "processGitSubmissionV2",
    /**
     * Grade a learner Google Docs submission (worker pipeline).
     */
    ProcessGoogleDocsSubmission = "processGoogleDocsSubmission",
    /**
     * Grade a SCHEMA V2 learner Google Docs submission against outcome/approach criteria.
     */
    ProcessGoogleDocsSubmissionV2 = "processGoogleDocsSubmissionV2",
    /**
     * Invite a user to a GitHub organization/team.
     */
    ResolveGithub = "resolveGithub",
    /**
     * Grade a CV submission (worker pipeline).
     */
    ProcessCvSubmission = "processCvSubmission",
    /**
     * Send an email via the Brevo SMTP gateway.
     */
    SendMail = "sendMail",
    /**
     * Sync a source entity into ScyllaDB.
     */
    SyncScyllaDB = "syncScyllaDB",
    /**
     * Rebuild the email bloom filter from PostgreSQL user emails (background job).
     */
    SyncEmailBloomFilter = "syncEmailBloomFilter",
    /**
     * Sync one entity to the CDN (background job).
     */
    SyncCdn = "syncCdn",
    /**
     * Index one entity into Elasticsearch (background job).
     */
    SyncElasticsearch = "syncElasticsearch",
    /**
     * Prime/refresh parent-index cache for entities (background job).
     */
    SyncIndexer = "syncIndexer",
    /**
     * Encode and package a video into MPEG-DASH format (admin background job).
     */
    ProcessVideo = "processVideo",
    /**
     * Grade a personal project GitHub submission against task criteria.
     */
    ProcessPersonalProject = "processPersonalProject",
    /**
     * Generate personalised tasks for a personal project from the learner's idea.
     */
    GeneratePersonalProjectTasks = "generatePersonalProjectTasks",
    /**
     * Review a single personal project task against its criteria via AI.
     */
    ReviewPersonalProjectTask = "reviewPersonalProjectTask",
    /**
     * Purchase an AI subscription tier (grants tier on payment success).
     */
    AiSubscriptionPurchase = "aiSubscriptionPurchase",
    /**
     * Judge a LeetCode-style coding submission against testcases via Judge0.
     */
    JudgeCodingSubmission = "judgeCodingSubmission",
}

export const GraphQLTypeActionType = createEnumType(ActionType)

/**
 * Register the action type enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeActionType,
    {
        name: "ActionType",
        description: "The type of action performed on a preflight transaction.",
        valuesMap: {
            [ActionType.Enroll]: {
                description: "The action type for a course enrollment.",
            },
            [ActionType.ProcessGitSubmission]: {
                description: "Process and grade a GitHub challenge submission.",
            },
            [ActionType.ProcessGitSubmissionV2]: {
                description: "Process and grade a SCHEMA V2 GitHub submission against criteria.",
            },
            [ActionType.ProcessGoogleDocsSubmission]: {
                description: "Process and grade a Google Docs challenge submission.",
            },
            [ActionType.ProcessGoogleDocsSubmissionV2]: {
                description: "Process and grade a SCHEMA V2 Google Docs submission against criteria.",
            },
            [ActionType.ResolveGithub]: {
                description: "Resolve GitHub account and enqueue organization/team membership update.",
            },
            [ActionType.SyncScyllaDB]: {
                description: "Synchronize an entity to ScyllaDB.",
            },
            [ActionType.SyncEmailBloomFilter]: {
                description: "Rebuild the email bloom filter from user rows (batched).",
            },
            [ActionType.SyncCdn]: {
                description: "Synchronize one entity to the CDN (S3 / static assets).",
            },
            [ActionType.SyncElasticsearch]: {
                description: "Index one entity into Elasticsearch for search.",
            },
            [ActionType.SyncIndexer]: {
                description: "Prime parent-index cache for entities (challenge/content).",
            },
            [ActionType.ProcessVideo]: {
                description: "Encode and package a video into MPEG-DASH format.",
            },
            [ActionType.ProcessPersonalProject]: {
                description: "Grade a personal project GitHub submission against task criteria.",
            },
            [ActionType.GeneratePersonalProjectTasks]: {
                description: "Generate personalised tasks for a personal project from the learner's idea.",
            },
            [ActionType.ReviewPersonalProjectTask]: {
                description: "Review a single personal project task against its criteria via AI.",
            },
            [ActionType.AiSubscriptionPurchase]: {
                description: "Purchase an AI subscription tier (grants tier on payment success).",
            },
            [ActionType.JudgeCodingSubmission]: {
                description: "Judge a coding submission against testcases via Judge0.",
            },
        },
    },
)