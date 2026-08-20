import {
    UpdateProfileResolver,
} from "./update-profile.resolver"

describe("UpdateProfileResolver",
    () => {
        it("merges trimmed identity, preference, and branding patches and refreshes the row",
            async () => {
                const updated = {
                    id: "user-1",
                    displayName: "Updated",
                }
                const entityManager = {
                    update: jest.fn().mockResolvedValue({
                        affected: 1 
                    }),
                    findOneByOrFail: jest.fn().mockResolvedValue(updated),
                }
                const userService = {
                    invalidateProfileLocked: jest.fn().mockResolvedValue(undefined),
                }
                const resolver = new UpdateProfileResolver(entityManager as never,
            userService as never)

                await expect(resolver.execute({
                    displayName: "  Updated  ",
                    bio: null,
                    avatar: "https://cdn.example.test/avatar.png",
                    profileLocked: true,
                    openToWork: false,
                    emailDigestEnabled: true,
                    featuredAchievementSlug: null,
                    roleTitle: "  Staff Engineer ",
                    location: "  Remote  ",
                    workMode: null,
                    linkedinUrl: "https://linkedin.example.test/user",
                    websiteUrl: null,
                    accentColor: "#abc",
                    backgroundEffect: "aurora",
                } as never,
        {
            id: "user-1" 
        } as never)).resolves.toBe(updated)

                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "user-1" 
                    },
                    {
                        displayName: "Updated",
                        bio: null,
                        avatar: "https://cdn.example.test/avatar.png",
                        roleTitle: "Staff Engineer",
                        location: "Remote",
                        profileLocked: true,
                        openToWork: false,
                        emailDigestEnabled: true,
                        featuredAchievementSlug: null,
                        workMode: null,
                        linkedinUrl: "https://linkedin.example.test/user",
                        websiteUrl: null,
                        accentColor: "#abc",
                        backgroundEffect: "aurora",
                    },
                )
                expect(userService.invalidateProfileLocked).toHaveBeenCalledWith("user-1")
                expect(entityManager.findOneByOrFail).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "user-1" 
                    },
                )
            })

        it("skips the database write and cache invalidation for an empty patch",
            async () => {
                const entityManager = {
                    update: jest.fn(),
                    findOneByOrFail: jest.fn().mockResolvedValue({
                        id: "user-1" 
                    }),
                }
                const userService = {
                    invalidateProfileLocked: jest.fn(),
                }
                const resolver = new UpdateProfileResolver(entityManager as never,
            userService as never)

                await expect(resolver.execute({
                } as never,
            {
                id: "user-1" 
            } as never)).resolves.toEqual({
                    id: "user-1" 
                })
                expect(entityManager.update).not.toHaveBeenCalled()
                expect(userService.invalidateProfileLocked).not.toHaveBeenCalled()
            })

        it("preserves omitted fields while accepting explicit nulls in each helper",
            () => {
                const resolver = new UpdateProfileResolver(undefined as never,
            undefined as never)
                const helpers = resolver as unknown as {
            buildIdentityPatch: (request: Record<string, unknown>) => Record<string, unknown>
            buildPreferencePatch: (request: Record<string, unknown>) => Record<string, unknown>
            buildBrandingPatch: (request: Record<string, unknown>) => Record<string, unknown>
        }

                expect(helpers.buildIdentityPatch({
                    displayName: null,
                    bio: "  bio ",
                    avatar: undefined,
                    roleTitle: null,
                    location: "  Hanoi ",
                })).toEqual({
                    displayName: null,
                    bio: "bio",
                    roleTitle: null,
                    location: "Hanoi",
                })
                expect(helpers.buildPreferencePatch({
                    profileLocked: undefined,
                    openToWork: true,
                    emailDigestEnabled: null,
                    featuredAchievementSlug: null,
                    workMode: "remote",
                })).toEqual({
                    openToWork: true,
                    emailDigestEnabled: null,
                    featuredAchievementSlug: null,
                    workMode: "remote",
                })
                expect(helpers.buildBrandingPatch({
                    linkedinUrl: null,
                    websiteUrl: "https://example.test",
                    accentColor: null,
                    backgroundEffect: "none",
                })).toEqual({
                    linkedinUrl: null,
                    websiteUrl: "https://example.test",
                    accentColor: null,
                    backgroundEffect: "none",
                })
            })
    })
