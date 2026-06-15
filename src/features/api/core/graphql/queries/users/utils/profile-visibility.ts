import type {
    EntityManager,
} from "typeorm"
import {
    UserEntity,
} from "@modules/databases"

/** Params for {@link isProfileHiddenFromViewer}. */
export interface IsProfileHiddenFromViewerParams {
    /** Primary entity manager used to read the target's lock flag. */
    entityManager: EntityManager
    /** Id of the profile owner being viewed. */
    userId: string
    /** Id of the signed-in viewer, or null/undefined when anonymous. */
    viewerId?: string | null
}

/**
 * Whether a profile's tab content must be withheld from the given viewer.
 *
 * A locked profile (Facebook-style "lock profile") hides its activity /
 * achievements / courses / contribution tabs from everyone except the owner.
 * Returns true only when the target profile is locked AND the viewer is not the
 * owner — the public queries then short-circuit to an empty result.
 *
 * @param params - {@link IsProfileHiddenFromViewerParams}
 * @returns true when the content must be hidden from this viewer.
 */
export const isProfileHiddenFromViewer = async ({
    entityManager,
    userId,
    viewerId,
}: IsProfileHiddenFromViewerParams): Promise<boolean> => {
    // the owner always sees their own profile, locked or not
    if (viewerId && viewerId === userId) {
        return false
    }
    // read just the lock flag for the target user (no need to load the whole row)
    const target = await entityManager.findOne(
        UserEntity,
        {
            where: {
                id: userId,
            },
            select: {
                id: true,
                profileLocked: true,
            },
        },
    )
    // unknown user → nothing to hide (the query would return empty anyway)
    return Boolean(target?.profileLocked)
}
