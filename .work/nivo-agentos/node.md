---
{"schema":"work/node@1","id":"nivo.agentos","kind":"business","required":true}
---
# Nivo AgentOS: shared lifecycle, Chatbot, and Accounting

## Purpose and authority

This completion tree tracks exactly the three active Nivo work streams reviewed on 2026-09-08: the shared AgentOS module lifecycle, Chatbot, and Accounting. Global sign-in is a sibling business under `.work/login`; AgentOS references it only as an execution prerequisite.

## Scope

The tree owns business requirements, architecture, implementation, and UAT obligations for those three streams. It does not own global authentication. It excludes unrelated Nivo products, historical task transcripts, secret material, and Git worktree lifecycle management.

## Completion rule

A parent branch is complete only when all required descendant leaves are effectively complete. Leaves carry state; branch nodes do not. A code, business, architecture, environment, identity, fixture, or visual-direction revision invalidates every consumer connected through `refs` or `dependsOn`.

## Current migration posture

Historical source, commits, browser captures, and walk results are preserved as inputs. They are not silently converted into fresh UAT certification. UI leaves remain suspended until an approved visual direction exists, even where draft direction images or historical screenshots are available.
