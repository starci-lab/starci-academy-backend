/**
 * Per-room ring buffer capacity.
 *
 * When a room's stored history exceeds this many messages the oldest entry is
 * dropped. `replay-since` responses are also capped to this size so a fresh
 * client sending `lastSeq=0` never pulls an unbounded backlog.
 */
export const CHAT_RING_CAP = 100
