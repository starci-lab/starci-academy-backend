import {
    ActiveAdvertisementResolver 
} from "./active-advertisement.resolver"
import {
    AdvertisementPlacement 
} from "@modules/databases/postgresql/primary/enums/advertisement-placement"
import {
    Locale 
} from "@modules/databases/postgresql/primary/enums/locale"
const ad = {
    id: "a1",
    mediaType: "image",
    media: {
        url: "x" 
    },
    title: {
        en: "Sale", vi: "Promotion" 
    },
    ctaText: {
        en: "View", vi: "View" 
    },
    linkUrl: "https://x",
    sponsorName: "Acme",
}
const make = () => {
    const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(ad),
    }
    const h = {
        entityManager: {
            createQueryBuilder: jest.fn().mockReturnValue(qb) 
        },
        membershipService: {
            isActive: jest.fn().mockResolvedValue(false) 
        },
        userService: {
            checkEnrollment: jest.fn().mockResolvedValue(false) 
        },
        winstonService: {
            log: jest.fn() 
        },
    }
    return {
        resolver: new ActiveAdvertisementResolver(
      h.entityManager as never,
      h.membershipService as never,
      h.userService as never,
      h.winstonService as never,
        ),
        ...h,
        qb,
    }
}
describe("ActiveAdvertisementResolver",
    () => {
        it("returns localized active ad and applies ranking query",
            async () => {
                const h = make()
                await expect(
                    h.resolver.execute(
                        Locale.Vi,
                        undefined,
                        AdvertisementPlacement.DashboardRight,
                    ),
                ).resolves.toEqual({
                    id: "a1",
                    mediaType: "image",
                    media: ad.media,
                    title: "Promotion",
                    ctaText: "View",
                    linkUrl: ad.linkUrl,
                    sponsorName: ad.sponsorName,
                })
                expect(h.qb.where).toHaveBeenCalledWith("a.placement = :placement",
                    {
                        placement: AdvertisementPlacement.DashboardRight,
                    })
                expect(h.qb.orderBy).toHaveBeenCalledWith("a.isHouseAd",
                    "ASC")
            })
        it("hides ads for active members and enrolled users",
            async () => {
                const h = make()
                h.membershipService.isActive.mockResolvedValue(true)
                await expect(
                    h.resolver.execute(
                        Locale.En,
        {
            id: "u1" 
        } as never,
        AdvertisementPlacement.DashboardRight,
                    ),
                ).resolves.toBeNull()
                expect(h.entityManager.createQueryBuilder).not.toHaveBeenCalled()
                const h2 = make()
                h2.userService.checkEnrollment.mockResolvedValue(true)
                await expect(
                    h2.resolver.execute(
                        Locale.En,
        {
            id: "u1" 
        } as never,
        AdvertisementPlacement.LessonInline,
        "c1",
                    ),
                ).resolves.toBeNull()
            })
        it("fails open when exemption checks fail and returns null for no ad",
            async () => {
                const h = make()
                h.membershipService.isActive.mockRejectedValue(new Error("db down"))
                h.qb.getOne.mockResolvedValue(null)
                await expect(
                    h.resolver.execute(
                        Locale.En,
        {
            id: "u1" 
        } as never,
        AdvertisementPlacement.DashboardRight,
                    ),
                ).resolves.toBeNull()
                expect(h.winstonService.log).toHaveBeenCalled()
                expect(h.qb.getOne).toHaveBeenCalled()
            })
    })
