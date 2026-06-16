import type {
    PropsWithChildren,
} from "react"

/** Props for the labelled native select field (target pickers). */
export type SelectFieldProps = PropsWithChildren<{
    /** Field label rendered above the select. */
    label: string
    /** Currently selected option value. */
    value: string
    /** Called with the new value when the selection changes. */
    onChange: (v: string) => void
}>

/** Props for the primary submit button that shows a spinner while pending. */
export type SubmitButtonProps = PropsWithChildren<{
    /** Whether the action is in flight (disables + shows spinner). */
    pending: boolean
    /** Optional extra disabled flag combined with `pending`. */
    disabled?: boolean
    /** Called when the button is pressed. */
    onPress: () => void
}>

/** Props for a titled block inside a tab panel. */
export type BlockProps = PropsWithChildren<{
    /** Block heading text. */
    title: string
    /** Optional secondary hint line under the title. */
    hint?: string
}>
