jest.mock("octokit",
    () => ({
        Octokit: class Octokit {},
    }))
import {
    MyGithubTeamStatusHandler
} from "./my-github-team-status.handler"
describe("MyGithubTeamStatusHandler",
    () => {
        it("skips unmapped courses and reports an unlinked user",
            async () => {
                const manager = {
                    find: jest.fn().mockResolvedValue([{
                        course: {
                            id: "c", displayId: "unknown", title: "Course"
                        }
                    },
                    {
                        course: null
                    }])
                }
                const github = {
                    getUserTeamMembership: jest.fn()
                }
                const result = await new MyGithubTeamStatusHandler(manager as never,
github as never).execute({
    id: "u", githubUsername: null
} as never)
                expect(result).toMatchObject({
                    linked: false, githubUsername: null, teams: [], allInTeam: true
                })
                expect(github.getUserTeamMembership).not.toHaveBeenCalled()
            })
        it("delegates linked membership and reports active teams",
            async () => {
                const manager = {
                    find: jest.fn().mockResolvedValue([{
                        course: {
                            id: "c", displayId: "fullstack-mastery", title: "Course"
                        }
                    }])
                }
                const github = {
                    getUserTeamMembership: jest.fn().mockResolvedValue({
                        state: "active"
                    })
                }
                const result = await new MyGithubTeamStatusHandler(manager as never,
github as never).execute({
    id: "u", githubUsername: "octo"
} as never)
                expect(result.linked).toBe(true)
                expect(result.allInTeam).toBe(true)
                expect(github.getUserTeamMembership).toHaveBeenCalled()
            })
    })
