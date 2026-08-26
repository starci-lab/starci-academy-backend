import {
    AvatarKeyOwnershipMismatchException,
} from "@modules/platform/exceptions/errors/profile/avatar-key-ownership-mismatch"
import {
    VerifyAvatarPresignUrlCommand,
} from "./verify-avatar-presign-url.command"
import {
    VerifyAvatarPresignUrlHandler,
} from "./verify-avatar-presign-url.handler"

describe("VerifyAvatarPresignUrlHandler",
    () => {
        it("rejects a key outside the authenticated user's avatar prefix",
            async () => {
                const s3ReadService = {
                    exists: jest.fn(),
                }
                const handler = new VerifyAvatarPresignUrlHandler({
                    update: jest.fn(),
                } as never,
                s3ReadService as never,
                {
                    buildPublicObjectUrl: jest.fn(),
                } as never)

                await expect(handler.execute(new VerifyAvatarPresignUrlCommand({
                    user: {
                        id: "user-1",
                    } as never,
                    request: {
                        key: "avatars/other-user/avatar.png",
                    },
                }))).rejects.toBeInstanceOf(AvatarKeyOwnershipMismatchException)
                expect(s3ReadService.exists).not.toHaveBeenCalled()
            })

        it("returns an unuploaded result without mutating the user",
            async () => {
                const update = jest.fn()
                const handler = new VerifyAvatarPresignUrlHandler({
                    update,
                } as never,
                {
                    exists: jest.fn().mockResolvedValue(false),
                } as never,
                {
                    buildPublicObjectUrl: jest.fn(),
                } as never)

                await expect(handler.execute(new VerifyAvatarPresignUrlCommand({
                    user: {
                        id: "user-1",
                    } as never,
                    request: {
                        key: "avatars/user-1/avatar.png",
                    },
                }))).resolves.toEqual({
                    uploaded: false,
                    url: null,
                })
                expect(update).not.toHaveBeenCalled()
            })
    })
