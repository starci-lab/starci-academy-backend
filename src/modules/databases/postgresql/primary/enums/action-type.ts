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
     * Invite a user to a GitHub organization/team.
     */
    InviteGithub = "inviteGithub",
    /**
     * Grade a CV submission (worker pipeline).
     */
    ProcessCvSubmission = "processCvSubmission",
    /**
     * Send an email via the Mailcow SMTP gateway.
     */
    SendMail = "sendMail",
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
        },
    },
)