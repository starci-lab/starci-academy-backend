import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Ambient background effect the user has chosen for the app chrome (never the
 * lesson reading column — {@link import("@/components/blocks/layout/AmbientBackground").AmbientBackground}
 * on the FE hides itself under `/learn`). Purely decorative; independent of
 * light/dark mode. Stored in `users.background_effect`, default `None`.
 */
export enum BackgroundEffect {
    None = "none",
    Ember = "ember",
    Wave = "wave",
    Snow = "snow",
    Rain = "rain",
    Bubbles = "bubbles",
    Fireflies = "fireflies",
    Stars = "stars",
    Aurora = "aurora",
    Circuit = "circuit",
}

export const GraphQLTypeBackgroundEffect = createEnumType(
    BackgroundEffect,
)

registerEnumType(
    GraphQLTypeBackgroundEffect,
    {
        name: "BackgroundEffect",
        description: "Ambient background effect chosen for the app chrome (independent of light/dark mode).",
        valuesMap: {
            [BackgroundEffect.None]: {
                description: "No ambient effect.",
            },
            [BackgroundEffect.Ember]: {
                description: "Warm embers drifting upward.",
            },
            [BackgroundEffect.Wave]: {
                description: "Layered waves drifting at the bottom edge.",
            },
            [BackgroundEffect.Snow]: {
                description: "Snowflakes drifting downward.",
            },
            [BackgroundEffect.Rain]: {
                description: "Rain streaks falling.",
            },
            [BackgroundEffect.Bubbles]: {
                description: "Bubbles rising and wobbling.",
            },
            [BackgroundEffect.Fireflies]: {
                description: "Slow-drifting fireflies that flicker.",
            },
            [BackgroundEffect.Stars]: {
                description: "Twinkling starfield.",
            },
            [BackgroundEffect.Aurora]: {
                description: "Soft moving aurora ribbons.",
            },
            [BackgroundEffect.Circuit]: {
                description: "Pulsing circuit-board grid lines.",
            },
        },
    },
)
