---
{
  "schema": "work/node@1",
  "id": "nivo.chatbot.implementation",
  "kind": "implementation",
  "required": true,
  "dependsOn": [
    "nivo.chatbot.architecture.data-ownership",
    "nivo.chatbot.architecture.api-events",
    "nivo.chatbot.architecture.code-scope"
  ]
}
---
# Chatbot implementation

## Purpose
Bind backend and frontend delivery independently to their repositories after approved business and architecture inputs. Source presence alone does not complete either leaf.

## Done when
Both repository leaves have scoped commits, current tests and evidence for their declared assertions, with shared prerequisites satisfied.
