/**
 * Execution-result key under which the plan step persists its entitlement
 * decision so the analyze step can reuse it WITHOUT a second `consume`
 * (1 CV review = 1 charge).
 */
export const CV_AI_INVOKE_DECISION_KEY = "ai-invoke-decision"
