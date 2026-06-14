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
     * Grade a learner GitHub submission against outcome/approach criteria (worker pipeline).
     */
    ProcessGitSubmission = "processGitSubmission",
    /**
     * Grade a learner Google Docs submission against outcome/approach criteria (worker pipeline).
     */
    ProcessGoogleDocsSubmission = "processGoogleDocsSubmission",
    /**
     * Invite a user to a GitHub organization/team.
     */
    ResolveGithub = "resolveGithub",
    /**
     * Remove a user from a GitHub organization/team (course access removal).
     */
    RevokeGithub = "revokeGithub",
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
    /**
     * Poll a pending payment transaction's gateway status (delayed, repeated) and
     * finalize it as succeeded on payment, or mark it unpaid once attempts are exhausted.
     */
    ReconcileTransaction = "reconcileTransaction",
    /**
     * Grade an AI Lab eval submission (prompt template) against an eval set's cases.
     */
    ReviewAiLabEval = "reviewAiLabEval",
    /**
     * Purchase a community membership (grants/extends membership on payment success).
     */
    MembershipPurchase = "membershipPurchase",
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
                description: "Process and grade a GitHub submission against outcome/approach criteria.",
            },
            [ActionType.ProcessGoogleDocsSubmission]: {
                description: "Process and grade a Google Docs submission against outcome/approach criteria.",
            },
            [ActionType.ResolveGithub]: {
                description: "Resolve GitHub account and enqueue organization/team membership update.",
            },
            [ActionType.RevokeGithub]: {
                description: "Revoke a user's GitHub organization/team membership (course access removal).",
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
            [ActionType.ReconcileTransaction]: {
                description: "Poll a pending transaction's gateway status; finalize on payment or mark unpaid when exhausted.",
            },
            [ActionType.ReviewAiLabEval]: {
                description: "Grade an AI Lab eval submission (prompt template) against an eval set's cases.",
            },
            [ActionType.MembershipPurchase]: {
                description: "Purchase a community membership (grants/extends membership on payment success).",
            },
        },
    },
)