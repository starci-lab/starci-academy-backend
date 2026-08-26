import {
    SeedersService,
} from "./seeders.service"

describe("SeedersService",
    () => {
        it("runs every domain seeder in the declared dependency order",
            async () => {
                const calls: Array<string> = []
                const makeSeeder = (name: string) => ({
                    seed: jest.fn(async () => {
                        calls.push(name)
                    }),
                })
                const seeders = {
                    catalog: makeSeeder("catalog"),
                    course: makeSeeder("course"),
                    cv: makeSeeder("cv"),
                    foundation: makeSeeder("foundation"),
                    headhunter: makeSeeder("headhunter"),
                    coding: makeSeeder("coding"),
                    advertisement: makeSeeder("advertisement"),
                    changelog: makeSeeder("changelog"),
                    blog: makeSeeder("blog"),
                    achievement: makeSeeder("achievement"),
                    interview: makeSeeder("interview"),
                }
                const service = new SeedersService(seeders.course as never,
            seeders.cv as never,
            seeders.foundation as never,
            seeders.headhunter as never,
            seeders.catalog as never,
            seeders.coding as never,
            seeders.advertisement as never,
            seeders.changelog as never,
            seeders.blog as never,
            seeders.achievement as never,
            seeders.interview as never)

                await service.init()

                expect(calls).toEqual([
                    "catalog",
                    "course",
                    "cv",
                    "foundation",
                    "headhunter",
                    "coding",
                    "advertisement",
                    "changelog",
                    "blog",
                    "achievement",
                    "interview",
                ])
            })
        it("stops at the first failed domain seeder",
            async () => {
                const failure = new Error("catalog unavailable")
                const catalog = {
                    seed: jest.fn().mockRejectedValue(failure),
                }
                const later = {
                    seed: jest.fn(),
                }
                const service = new SeedersService(later as never,
            later as never,
            later as never,
            later as never,
            catalog as never,
            later as never,
            later as never,
            later as never,
            later as never,
            later as never,
            later as never)

                await expect(service.init()).rejects.toBe(failure)
                expect(later.seed).not.toHaveBeenCalled()
            })

        it("runs earlier seeders before propagating a later failure",
            async () => {
                const calls: Array<string> = []
                const makeSeeder = (name: string, failure?: Error) => ({
                    seed: jest.fn(async () => {
                        calls.push(name)
                        if (failure) {
                            throw failure
                        }
                    }),
                })
                const failure = new Error("course failed")
                const catalog = makeSeeder("catalog")
                const course = makeSeeder(
                    "course",
                    failure,
                )
                const later = makeSeeder("later")
                const service = new SeedersService(
                    course as never,
                    later as never,
                    later as never,
                    later as never,
                    catalog as never,
                    later as never,
                    later as never,
                    later as never,
                    later as never,
                    later as never,
                    later as never,
                )

                await expect(service.init()).rejects.toBe(failure)
                expect(calls).toEqual([
                    "catalog",
                    "course",
                ])
                expect(later.seed).not.toHaveBeenCalled()
            })
    })
