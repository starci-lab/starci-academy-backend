# Chat — business state map

Source: `src/modules/bussiness/chat/chat.service.ts` + entities
`chat-conversation.entity.ts`, `chat-message.entity.ts` under
`src/modules/databases/postgresql/primary/entities/`.

Two conversation shapes, member-gated: one global community room, and one
private founder DM per member. No group DMs, no arbitrary 1:1s between
regular members.

## Entities

- **ChatConversationEntity** (`chat_conversations`) — `type` (`Community` |
  `FounderDm`), `memberId` (null for the community room; the owning member
  for a DM). Unique on `(type, member)` — enforced at the DB level, so at
  most one community row and at most one DM row per member can ever exist.
- **ChatMessageEntity** (`chat_messages`) — `body`, `isDeleted`,
  `conversationId`, `authorId`.

## States and transitions

### Conversation
Lazily created, never explicitly destroyed. `getOrCreateCommunityConversation`
and `getOrCreateFounderDm` are pure find-or-create — the first caller ever to
ask for "the community room" or "member X's founder DM" creates the singleton
row; every subsequent caller gets the same row back. There is no "close" or
"archive" transition — a conversation, once created, exists forever from the
API's point of view.

### Message
`draft` → **send** → `live`. **There is no edit or delete transition reachable
through the API** — `ChatService` has no `updateMessage`/`softDeleteMessage`
method, and no GraphQL mutation exists beyond `sendChatMessage` (grep of
`src/features/api/core/graphql/mutations/chat/` shows only
`send-chat-message`). A message, once sent, is permanent from the client's
perspective.

## Invariants

1. **Chat is member-only.** `assertCanAccess` requires
   `membershipService.isActive(user.id)` for *every* read (`listMessages`)
   and write (`sendMessage`) — including the global community room. A
   non-member cannot even read the community feed of messages.
   (`chat.service.ts:230-241`)
2. **A founder DM is doubly-scoped**: member-only (invariant 1) AND
   restricted further to `conversation.memberId === user.id` OR
   `user.username === founderUsername` (`chat.service.ts:242-252`). Any other
   active member who somehow learns another member's DM `conversationId`
   cannot read or send into it.
3. **Exactly one community conversation, exactly one founder-DM conversation
   per member** — guaranteed by the DB unique constraint on `(type, member)`,
   not just application logic; a race between two concurrent
   first-ever-open calls is resolved at the database, not the service (though
   the service itself has no explicit handling for the resulting unique-
   violation — see findings).
4. **`isDeleted` exists on `ChatMessageEntity` and is documented as
   "soft-deleted by its author," but no code path ever sets it true.** The
   column is exposed on the GraphQL type (`@Field(() => Boolean)`) and always
   reads `false`. Treat this as a field the schema exposes but the backend
   does not yet support — see findings for the naming/business-logic
   implication.

## Cross-domain notes

- Founder identity is, once again, `user.username ===
  envConfig().community.founderUsername` (`chat.service.ts:244`) — the same
  pattern as Community's pin-gate and Discussion's founder-answered flag.
- Sending a message fans out `EventName.ChatMessageCreated` for the Socket.IO
  gateway to push into the conversation's room; there is no
  `ChatMessageUpdated`/`ChatMessageDeleted` event (consistent with there being
  no edit/delete path at all).
