# Overview · Separated app dashboards and create flows

## Purpose

Authenticated owners manage existing AgentOS workspaces and Template Apps on dashboard-only routes, start new resources on separate pre-persistence create routes, and resume persisted resources only on order-, workspace-, or site-owned routes.

## Included

- AgentOS management dashboard at /:locale/agentos without an embedded create or provisioning form.
- AgentOS pre-persistence creation at /:locale/agentos/create and post-persistence resume at /:locale/agentos/orders/:orderId.
- AgentOS terminal management at /:locale/agentos/workspaces/:workspaceId.
- Template Apps management dashboard at /:locale/apps without an embedded create or provisioning form.
- Template App pre-persistence creation at /:locale/apps/create/:templateKey and post-persistence resume at /:locale/apps/:siteId/provisioning.
- Template App terminal management at /:locale/apps/:siteId.

## Excluded

- Backend API, schema or lifecycle changes.
- Changes to AgentOS order, payment or provisioning semantics.
- Changes to Template App deployment semantics or template eligibility.
- Persisted order, workspace or site identifiers on a create route.
- A generic Template App order route that the current site-creation contract does not return.

## Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/nivo-fe.git | `894e608bba73d791e5d2767cdc420da770c8c42b` |
