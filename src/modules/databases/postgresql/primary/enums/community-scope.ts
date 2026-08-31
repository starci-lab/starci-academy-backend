import { registerEnumType } from "@nestjs/graphql"

export enum CommunityScope {
    Global = "GLOBAL",
    Course = "COURSE",
}

registerEnumType(CommunityScope, {
    name: "CommunityScope",
})
