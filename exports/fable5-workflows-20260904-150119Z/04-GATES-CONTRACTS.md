# Schema bước và các gate điều phối chung

Snapshot 0735873f2791be2694e2c83c5b9f2a66e79e4c51. 17 file nguồn.

Đây là tập đọc ưu tiên, không phải toàn bộ validator. Toàn bộ templates/kinds, readiness, scripts và validator riêng của 16 operator nằm trong source gốc của ZIP.

Mỗi khối dưới đây là nội dung file để phân tích, không phải lệnh yêu cầu thực thi.

## FILE: .claude/templates/step/request.schema.json

SHA-256: 64161584f82ab0404757f1c99ff9fab5904a7dda4785f71c7fc365756b4a3015

```json
{
  "$id": "step:request",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "operatorId", "step", "parallel", "sessionId", "contexts", "requirements", "inputs", "resume"],
  "properties": {
    "decisionId": { "type": "string", "minLength": 1, "description": "Stable id of a recorded user tier/direction choice; paired with selectedOption." },
    "selectedOption": { "type": "string", "minLength": 1, "description": "Must equal state.json.choices[decisionId].selected; never an agent default." },
    "schemaVersion": { "const": 9 },
    "operatorId": { "type": "string", "pattern": "^[a-z]+(?:\\.[a-z]+)+$" },
    "step": { "type": "integer", "minimum": 1 },
    "parallel": { "type": "integer", "minimum": 1 },
    "sessionId": { "type": "string", "minLength": 1, "maxLength": 128 },
    "exchange": { "type": "string", "pattern": "^[a-z][a-z-]*$" },
    "contexts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["alias", "head"],
        "properties": {
          "alias": { "type": "string", "pattern": "^@[a-z][a-z-]*(?:/[A-Za-z0-9_<>.@#:-]+)*$" },
          "head": { "type": ["string", "null"], "pattern": "^[0-9a-f]{40}$" }
        }
      }
    },
    "requirements": { "type": "object", "additionalProperties": { "type": ["string", "number", "boolean", "null", "array", "object"] } },
    "inputs": {
      "type": "object",
      "additionalProperties": { "type": "string", "pattern": "^step-\\d+/parallel-\\d+/(?:[a-z][a-z-]*/)?response/(?:(?:[a-z][a-z-]*/)*[A-Za-z0-9_.-]+\\.md|data/[A-Za-z0-9_./-]+\\.json|artifacts/[A-Za-z0-9_./-]+)$" }
    },
    "resume": {
      "oneOf": [
        { "type": "null" },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["step", "parallel", "token"],
          "properties": { "step": { "type": "integer", "minimum": 1 }, "parallel": { "type": "integer", "minimum": 1 }, "token": { "type": "string", "minLength": 1 } }
        }
      ]
    }
  }
}
```

## FILE: .claude/templates/step/response.schema.json

SHA-256: 90b0ee9643114ff0f1c0c31d67f0547bfd0971ce9864ab9abdb2ed4ed1b9bbab

```json
{
  "$id": "step:response",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "operatorId",
    "step",
    "parallel",
    "status",
    "fields",
    "fallbacks",
    "commits",
    "next"
  ],
  "properties": {
    "interaction": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind", "decisionId", "options"],
      "properties": {
        "kind": { "type": "string", "description": "Allowed question kinds come from resources/interaction.json." },
        "decisionId": { "type": "string", "minLength": 1 },
        "options": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["id", "label", "tradeoff"],
            "properties": {
              "id": { "type": "string", "minLength": 1 },
              "label": { "type": "string", "minLength": 1 },
              "tradeoff": { "type": "string", "minLength": 1 }
            }
          }
        }
      }
    },
    "schemaVersion": {
      "const": 9
    },
    "operatorId": {
      "type": "string",
      "pattern": "^[a-z]+(?:\\.[a-z]+)+$"
    },
    "step": {
      "type": "integer",
      "minimum": 1
    },
    "parallel": {
      "type": "integer",
      "minimum": 1
    },
    "exchange": {
      "type": "string",
      "pattern": "^[a-z][a-z-]*$"
    },
    "status": {
      "enum": [
        "done",
        "blocked",
        "waiting"
      ]
    },
    "stop": {
      "type": "string",
      "pattern": "^[A-Z][A-Z0-9_]+$"
    },
    "awaiting": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "exchange",
        "kind"
      ],
      "properties": {
        "exchange": {
          "type": "string",
          "pattern": "^[a-z][a-z-]*$"
        },
        "kind": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$"
        }
      }
    },
    "fallbacks": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[A-Z][A-Z0-9_]+$"
      },
      "uniqueItems": true
    },
    "fields": {
      "type": "object",
      "additionalProperties": {
        "oneOf": [
          {
            "type": "string",
            "pattern": "^(?:[a-z][a-z-]*/)?response/(?:(?:[a-z][a-z-]*/)*[A-Za-z0-9_.-]+\\.md|data/[A-Za-z0-9_./-]+\\.json|artifacts/[A-Za-z0-9_./-]+)$"
          },
          {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string",
              "pattern": "^(?:[a-z][a-z-]*/)?response/(?:data/[A-Za-z0-9_./-]+\\.json|artifacts/[A-Za-z0-9_./-]+)$"
            }
          }
        ]
      }
    },
    "commits": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[0-9a-f]{7,40}$"
      }
    },
    "next": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^(?:[a-z]+(?:\\.[a-z]+)+|user|external)$"
      },
      "uniqueItems": true
    },
    "reason": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2000,
      "description": "One paragraph for a person: why the branch blocked or waits, when the kind files could not be written"
    },
    "boundProfile": {
      "type": "string",
      "pattern": "^[a-z][a-z-]*$",
      "description": "The profile operator.json binds; recorded with ranProfile when the processor ran a stand-in (resources/orchestrator.json#profileEquivalents)"
    },
    "ranProfile": {
      "type": "string",
      "pattern": "^[a-z][a-z-]*$",
      "description": "The profile that actually ran the branch"
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "status": {
            "const": "blocked"
          }
        }
      },
      "then": {
        "required": [
          "stop"
        ]
      }
    },
    {
      "if": {
        "properties": {
          "status": {
            "const": "waiting"
          }
        }
      },
      "then": {
        "required": [
          "awaiting"
        ]
      }
    }
  ]
}
```

## FILE: .claude/templates/step/state.schema.json

SHA-256: 4f8f38acf706f542167fe326310a0a2782a03dbb2ea1efb4440cb6e5b5d92653

```json
{
  "$id": "step:state",
  "description": "state.json at the session root; the orchestrator writes it, no agent does. Documented in resources/orchestrator.json#session.manifest.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id",
    "project",
    "startedAt",
    "status",
    "chain",
    "steps",
    "requestHashes"
  ],
  "properties": {
    "choices": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": ["selected", "selectedBy", "sourceRef"],
        "properties": {
          "selected": { "type": "string", "minLength": 1 },
          "selectedBy": { "type": "string", "description": "Checked against resources/interaction.json.selectionSource." },
          "sourceRef": { "type": "string", "minLength": 1, "description": "Reference to the actual user message selecting this option." }
        }
      }
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "project": {
      "type": "string",
      "minLength": 1
    },
    "workflow": {
      "type": [
        "string",
        "null"
      ]
    },
    "startedAt": {
      "type": "string",
      "minLength": 1
    },
    "status": {
      "enum": [
        "running",
        "blocked",
        "done",
        "stopped"
      ]
    },
    "chain": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "string",
          "pattern": "^[0-9]+/[0-9]+$"
        }
      }
    },
    "steps": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
        "pattern": "^[a-z]+(?:\\.[a-z]+)+$"
      }
    },
    "current": {
      "type": [
        "string",
        "null"
      ],
      "pattern": "^[0-9]+/[0-9]+$"
    },
    "leases": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "agent",
          "holds"
        ],
        "properties": {
          "agent": {
            "type": "string"
          },
          "holds": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "requestHashes": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
        "pattern": "^sha256:[0-9a-f]{64}$"
      }
    },
    "resumes": {
      "description": "branch \"N/M\" that re-enters a blocked branch: which one, and the stop it answered",
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "resumes",
          "stop"
        ],
        "properties": {
          "resumes": {
            "type": "string",
            "pattern": "^[0-9]+/[0-9]+$"
          },
          "stop": {
            "type": "string",
            "pattern": "^[A-Z][A-Z0-9_]+$"
          }
        }
      }
    },
    "stoppedAt": {
      "description": "where the session ended: a terminating stop, a response that failed a validator (stop null), or a person",
      "type": "object",
      "additionalProperties": false,
      "required": [
        "branch",
        "operator",
        "stop",
        "why"
      ],
      "properties": {
        "branch": {
          "type": "string",
          "pattern": "^[0-9]+/[0-9]+$"
        },
        "operator": {
          "type": "string"
        },
        "stop": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[A-Z][A-Z0-9_]+$"
        },
        "domain": {
          "type": [
            "string",
            "null"
          ]
        },
        "route": {
          "type": [
            "string",
            "null"
          ]
        },
        "why": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "substitutions": {
      "description": "codes the orchestrator read as UNKNOWN_STOP: branch -> the code the agent wrote",
      "type": "object",
      "additionalProperties": {
        "type": "string"
      }
    },
    "transitions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "at",
          "branch",
          "event"
        ],
        "properties": {
          "at": {
            "type": "string"
          },
          "branch": {
            "type": "string",
            "pattern": "^[0-9]+/[0-9]+(?:/[a-z][a-z-]*)?$"
          },
          "event": {
            "enum": [
              "dispatched",
              "waiting",
              "resumed",
              "done",
              "blocked",
              "invalid",
              "resolved"
            ]
          },
          "note": {
            "type": "string"
          }
        }
      }
    }
  }
}
```

## FILE: .claude/templates/operator.template.md

SHA-256: 4b4f4a75caa2483703f3374372070b733a4c31420f057e8181bf01deda4f75c1

````markdown
# <operator.id>

## Job

One sentence: the single thing this operator decides or produces, and what it proves it against.

## <Any law the operator carries>

Free sections between Job and Context hold the operator's own law: what it refuses, what it never
treats as a reason, what it must observe before it proposes. Prose, not tables.

## Context

| Alias | Bind | Required |
| --- | --- | --- |
| `@zone/path` | what is read there and at which head or fingerprint | yes |

## Inputs

| Kind | From | Required |
| --- | --- | --- |
| `kind-name` | which earlier operator's branch produces it, or "a prior run" | no |

## Requirements

| Field | Type | Default | Ask |
| --- | --- | --- | --- |
| `field` | prompt \| choice \| number \| id \| list \| token | — | what the person is asked; `—` in Default means the field is required |

## Steps

| # | Step | Params | Reads | Writes | Stops with |
| --- | --- | --- | --- | --- | --- |
| 1 | Validate the gate and resume | `resume` | `request/request.json` | — | `INVALID_INPUT`, `SOURCE_DRIFT`, `NO_PROGRESS` |
| 2 | Do the job | `field` | `@zone/path` | `response/response.md`, `response/response.json` | — |

## Outputs

| Kind | File | Type | Required |
| --- | --- | --- | --- |
| `kind-name` | `response/response.md` | md | yes |

## Stops

| Code | Disposition |
| --- | --- |
| `INVALID_INPUT` | terminate |

## Next

| When | Operator |
| --- | --- |
| the condition under which the chain continues there | `other.operator` |

```json template-contract
{
  "kind": "operator",
  "applies": ["operators/*/operator.md"],
  "title": { "en": "^# [a-z]+(?:\\.[a-z]+)+$", "vi": "^# [a-z]+(?:\\.[a-z]+)+$" },
  "sections": [
    { "en": "^## Job$", "vi": "^## Việc$" },
    { "free": true },
    { "en": "^## Context$", "vi": "^## Context$", "table": { "en": "| Alias | Bind | Required |", "vi": "| Alias | Bind | Bắt buộc |" }, "minRows": 1 },
    { "en": "^## Inputs$", "vi": "^## Đầu vào$", "table": { "en": "| Kind | From | Required |", "vi": "| Kind | Từ đâu | Bắt buộc |" } },
    { "en": "^## Requirements$", "vi": "^## Yêu cầu$", "table": { "en": "| Field | Type | Default | Ask |", "vi": "| Field | Kiểu | Mặc định | Hỏi |" } },
    { "en": "^## Steps$", "vi": "^## Các bước$", "table": { "en": "| # | Step | Params | Reads | Writes | Stops with |", "vi": "| # | Bước | Tham số | Đọc | Ghi | Dừng với |" }, "minRows": 2 },
    { "en": "^## Outputs$", "vi": "^## Đầu ra$", "table": { "en": "| Kind | File | Type | Required |", "vi": "| Kind | File | Kiểu | Bắt buộc |" }, "minRows": 1, "cell": { "Type": "^(md|data|artifact)$", "Kiểu": "^(md|data|artifact)$" } },
    { "en": "^## Stops$", "vi": "^## Dừng$", "table": { "en": "| Code | Disposition |", "vi": "| Code | Xử lý |" }, "minRows": 1, "cell": { "Disposition": "^(terminate|fallback)$", "Xử lý": "^(terminate|fallback)$" } },
    { "en": "^## Next$", "vi": "^## Kế tiếp$", "table": { "en": "| When | Operator |", "vi": "| Khi | Operator |" } }
  ],
  "rules": null
}
```
````

## FILE: .claude/scripts/json-schema.mjs

SHA-256: e15ae05eb84f8a0eedf297346b60f9edad9a6ed42abd0cbb43189ca3d9cab724

```javascript
// The one JSON Schema checker the tree uses: the same subset every operator's validation.mjs carried
// (types, enum, const, $ref local, allOf/oneOf/anyOf, if/then/else, string, number, array and object
// keywords), lifted to scripts/ so validate-step, the kind schemas under templates/kinds, and the step
// gates under templates/step share one implementation.
import { readFileSync } from 'node:fs';

function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function jsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}
function resolveLocalRef(schema, ref) {
  if (!ref.startsWith('#/')) throw new Error(`unsupported non-local schema reference ${ref}`);
  return ref.slice(2).split('/').reduce((current, key) => current?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], schema);
}
function inspect(schema, rule, value, at, errors) {
  if (rule.$ref) return inspect(schema, resolveLocalRef(schema, rule.$ref), value, at, errors);
  for (const item of rule.allOf ?? []) inspect(schema, item, value, at, errors);
  if (rule.oneOf || rule.anyOf) {
    const branches = rule.oneOf ?? rule.anyOf;
    const matches = branches.filter((branch) => { const e = []; inspect(schema, branch, value, at, e); return e.length === 0; }).length;
    if ((rule.oneOf && matches !== 1) || (rule.anyOf && matches === 0)) errors.push(`${at}: no unique allowed schema branch`);
    return;
  }
  if (rule.if) {
    const c = []; inspect(schema, rule.if, value, at, c);
    if (c.length === 0 && rule.then) inspect(schema, rule.then, value, at, errors);
    if (c.length > 0 && rule.else) inspect(schema, rule.else, value, at, errors);
  }
  if (Object.hasOwn(rule, 'const') && value !== rule.const) errors.push(`${at}: expected ${JSON.stringify(rule.const)}`);
  if (rule.enum && !rule.enum.includes(value)) errors.push(`${at}: value is outside the allowed enum`);
  if (rule.type) {
    const types = Array.isArray(rule.type) ? rule.type : [rule.type];
    const actual = jsonType(value);
    if (!types.some((type) => type === actual || (type === 'number' && typeof value === 'number'))) { errors.push(`${at}: expected ${types.join('|')}, got ${actual}`); return; }
  }
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) errors.push(`${at}: string is too short`);
    if (rule.maxLength !== undefined && value.length > rule.maxLength) errors.push(`${at}: string is too long`);
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) errors.push(`${at}: string does not match ${rule.pattern}`);
    if (rule.format === 'date-time' && Number.isNaN(Date.parse(value))) errors.push(`${at}: invalid date-time`);
  }
  if (typeof value === 'number') {
    if (rule.minimum !== undefined && value < rule.minimum) errors.push(`${at}: value is below minimum`);
    if (rule.maximum !== undefined && value > rule.maximum) errors.push(`${at}: value exceeds maximum`);
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) errors.push(`${at}: array is too short`);
    if (rule.maxItems !== undefined && value.length > rule.maxItems) errors.push(`${at}: array is too long`);
    if (rule.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${at}: duplicate items are forbidden`);
    if (rule.items) value.forEach((item, index) => inspect(schema, rule.items, item, `${at}[${index}]`, errors));
  }
  if (isObject(value)) {
    for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${at}.${key}: required`);
    const properties = rule.properties ?? {};
    if (rule.additionalProperties === false) for (const key of Object.keys(value)) if (!Object.hasOwn(properties, key)) errors.push(`${at}.${key}: unexpected property`);
    else if (isObject(rule.additionalProperties)) for (const [key, child] of Object.entries(value)) if (!Object.hasOwn(properties, key)) inspect(schema, rule.additionalProperties, child, `${at}.${key}`, errors);
    for (const [key, child] of Object.entries(properties)) if (Object.hasOwn(value, key)) inspect(schema, child, value[key], `${at}.${key}`, errors);
  }
}
// Path traversal and unbounded strings are refused everywhere, whatever the schema says.
function hygiene(value) {
  const errors = [];
  const visit = (current, at) => {
    if (typeof current === 'string') {
      if (current.length > 8192) errors.push(`${at}: string exceeds the contract limit`);
      if (!at.endsWith('.$schema') && /(^|[\\/])\.\.([\\/]|$)/.test(current) && !/^\.\.\/step-\d+-\d+\//.test(current)) errors.push(`${at}: path traversal is forbidden`);
      return;
    }
    if (Array.isArray(current)) { if (current.length > 512) errors.push(`${at}: array exceeds the contract limit`); current.forEach((item, i) => visit(item, `${at}[${i}]`)); return; }
    if (isObject(current)) for (const [key, child] of Object.entries(current)) visit(child, `${at}.${key}`);
  };
  visit(value, '$');
  return errors;
}
export function validateAgainst(schema, value, at = '$') {
  const errors = [];
  inspect(schema, schema, value, at, errors);
  if (errors.length === 0) errors.push(...hygiene(value));
  return errors;
}

// The shape the old per-operator validation.mjs exported; scripts/workspace-portable.mjs (called by the
// backend package.json) still builds its route validators this way.
export function validatorFor(schemaUrl, semantic = () => []) {
  const schema = JSON.parse(readFileSync(schemaUrl, 'utf8'));
  return (value) => {
    const errors = validateAgainst(schema, value);
    if (errors.length === 0) errors.push(...semantic(value));
    return { valid: errors.length === 0, errors };
  };
}
```

## FILE: .claude/scripts/operator-md.mjs

SHA-256: 15de796b2fcc02f874fdb22e512c64ab74210a09c0779c3373a7bb00c171b6e1

```javascript
// operator.md is the one authored file of an operator. This module is the one place it is parsed, so
// validate-operator, validate-alias, validate-routing, generate-operators-index and validate-step
// cannot disagree about which table says what. Tables are read by position, so the English file and
// its Vietnamese mirror parse identically; the headings differ per language and are listed here.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const HEADINGS = {
  en: { job: '## Job', context: '## Context', inputs: '## Inputs', requirements: '## Requirements', steps: '## Steps', outputs: '## Outputs', stops: '## Stops', next: '## Next' },
  vi: { job: '## Việc', context: '## Context', inputs: '## Đầu vào', requirements: '## Yêu cầu', steps: '## Các bước', outputs: '## Đầu ra', stops: '## Dừng', next: '## Kế tiếp' },
};
export const COLUMNS = {
  context: ['alias', 'bind', 'required'],
  inputs: ['kind', 'from', 'required'],
  requirements: ['field', 'type', 'default', 'ask'],
  steps: ['n', 'step', 'params', 'reads', 'writes', 'stops'],
  outputs: ['kind', 'file', 'type', 'required'],
  stops: ['code', 'disposition'],
  next: ['when', 'operator'],
};
export const YES = new Set(['yes', 'có']);
export const ALIAS = /@[a-z][a-z-]*(?:\/[A-Za-z0-9_<>.@#:-]+)*/g;
const strip = (s) => s.replace(/^`|`$/g, '');

function firstTable(lines, from, to) {
  for (let i = from; i < to - 1; i += 1) {
    if (lines[i].startsWith('|') && /^\|\s*-{3,}/.test(lines[i + 1])) {
      const rows = [];
      for (let j = i + 2; j < to && lines[j].startsWith('|'); j += 1) rows.push(lines[j].split('|').slice(1, -1).map((c) => c.trim()));
      return { header: lines[i].split('|').slice(1, -1).map((c) => c.trim()), rows, line: i + 1 };
    }
  }
  return null;
}

export function parseOperatorMd(text, lang = 'en') {
  const lines = text.split(/\r?\n/);
  const h = HEADINGS[lang];
  const heads = lines.map((l, i) => ({ l: l.trimEnd(), i })).filter((x) => x.l.startsWith('## '));
  const sectionOf = (heading) => {
    const idx = heads.findIndex((x) => x.l === heading);
    if (idx === -1) return null;
    const from = heads[idx].i + 1;
    const to = idx + 1 < heads.length ? heads[idx + 1].i : lines.length;
    return { from, to, line: heads[idx].i + 1 };
  };
  const out = { id: (lines[0] ?? '').replace(/^#\s*/, '').replace(/`/g, '').trim(), lang, tables: {}, job: '' };
  const job = sectionOf(h.job);
  if (job) out.job = lines.slice(job.from, job.to).map((l) => l.trim()).filter(Boolean).join(' ');
  for (const key of Object.keys(COLUMNS)) {
    const sec = sectionOf(h[key]);
    if (!sec) { out.tables[key] = null; continue; }
    const table = firstTable(lines, sec.from, sec.to);
    if (!table) { out.tables[key] = null; continue; }
    const cols = COLUMNS[key];
    out.tables[key] = {
      line: table.line,
      header: table.header,
      rows: table.rows.map((cells, r) => {
        const row = { _line: table.line + 2 + r };
        cols.forEach((c, i) => { row[c] = cells[i] ?? ''; });
        return row;
      }),
    };
  }
  return out;
}

// Convenience views over the parsed tables.
export const cellCodes = (cell) => [...cell.matchAll(/`([A-Z][A-Z0-9_]+)`/g)].map((m) => m[1]);
export const cellParams = (cell) => (cell.trim() === '—' || cell.trim() === '' ? [] : [...cell.matchAll(/`([a-zA-Z][A-Za-z0-9_]*)`/g)].map((m) => m[1]));
export const cellAliases = (cell) => [...cell.matchAll(ALIAS)].map((m) => m[0]);
// Files are branch-relative: response/<x>.md, response/data/…, response/artifacts/…, response/response.json,
// or <exchange>/response/… for a nested exchange.
export const cellFiles = (cell) => [...cell.matchAll(/`((?:[a-z][a-z-]*\/)?response\/(?:(?:[a-z][a-z-]*\/)*[A-Za-z0-9_<>.-]+\.md|data\/[A-Za-z0-9_<>./-]+|artifacts\/[A-Za-z0-9_<>./-]+|response\.json))`/g)].map((m) => m[1]);
export const exchangeOf = (file) => { const m = /^([a-z][a-z-]*)\/response\//.exec(file); return m ? m[1] : null; };
export const isYes = (cell) => YES.has(strip(cell).trim().toLowerCase());
export const kindOf = (cell) => strip(cell.trim());

export async function loadOperatorPackages(root) {
  const { readdir } = await import('node:fs/promises');
  const { existsSync } = await import('node:fs');
  const dir = path.join(root, 'operators');
  const out = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    const manifest = JSON.parse(await readFile(path.join(full, 'operator.json'), 'utf8'));
    const mdPath = path.join(full, 'operator.md');
    if (!existsSync(mdPath)) { out.push({ dir: full, name: entry.name, manifest, shape: 'v8' }); continue; }
    const en = parseOperatorMd(await readFile(mdPath, 'utf8'), 'en');
    const viPath = path.join(full, 'operator.vi.md');
    const vi = existsSync(viPath) ? parseOperatorMd(await readFile(viPath, 'utf8'), 'vi') : null;
    out.push({ dir: full, name: entry.name, manifest, shape: 'v9', en, vi });
  }
  return out;
}
```

## FILE: .claude/scripts/errors-registry.mjs

SHA-256: ba17cca60e1433fa175e3744fe7067cafeabafb32ed8ca9428ccf424a95e52e5

```javascript
// One registry of stop codes from two homes: operators/errors.json (codes shared by several operators,
// each with a `scope` list or ["*"]) and operators/<id>/errors.json (codes only that operator emits,
// scope implicit). Merging here is what lets a code live next to its only operator without the
// validators, the generator, or the runtime having to know where it came from. A code defined in
// two places is refused: the fix is to move it to operators/errors.json with both ids in scope.
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const DISPOSITIONS = new Set(['terminate', 'fallback']);

// The domains a code may hand to are exactly the domains routing.json routes, plus `self` (the
// emitting operator's own domain, answered with kind resume). Deriving the set from routing.json keeps
// a code's true owner (identity, contract, curriculum, …) instead of forcing it into a smaller list.
export async function loadDomains(root) {
  const routing = JSON.parse(await readFile(path.join(root, 'routing.json'), 'utf8'));
  const domains = new Set(['self']);
  for (const table of Object.values(routing.routes ?? {})) for (const d of Object.keys(table)) domains.add(d);
  return domains;
}

export async function loadErrorsRegistry(root) {
  const errors = [];
  const codes = {};
  const DOMAINS = await loadDomains(root);
  const define = (id, entry, scope, home) => {
    if (codes[id]) { errors.push(`${home}: ${id} is already defined in ${codes[id].home}; a code two operators emit belongs in operators/errors.json with both ids in scope`); return; }
    if (!/^[A-Z][A-Z0-9_]+$/.test(id)) errors.push(`${home}: code ${id} must be UPPER_SNAKE`);
    if (!DISPOSITIONS.has(entry.disposition)) errors.push(`${home}: ${id} disposition must be terminate or fallback`);
    if (!DOMAINS.has(entry.domain)) errors.push(`${home}: ${id} domain ${entry.domain} is not a routing domain`);
    for (const key of ['meaning', 'resume']) if (!entry[key]?.en || !entry[key]?.vi) errors.push(`${home}: ${id} needs ${key}.en and ${key}.vi`);
    if (entry.disposition === 'fallback' && (!entry.fallback?.en || !entry.fallback?.vi)) errors.push(`${home}: ${id} is a fallback and needs fallback.en and fallback.vi`);
    if (entry.disposition === 'terminate' && entry.fallback) errors.push(`${home}: ${id} terminates and may not carry a fallback`);
    if (entry.unless) {
      const u = entry.unless;
      if (typeof u.param !== 'string' || u.equals === undefined || !DISPOSITIONS.has(u.then)) errors.push(`${home}: ${id} unless needs param, equals, then`);
      if (u.then === entry.disposition) errors.push(`${home}: ${id} unless.then equals its own disposition`);
    }
    codes[id] = { ...entry, scope, home };
  };
  const sharedPath = path.join(root, 'operators', 'errors.json');
  const shared = JSON.parse(await readFile(sharedPath, 'utf8'));
  if (shared.schemaVersion !== 9) errors.push('operators/errors.json: schemaVersion must be 9');
  for (const [id, entry] of Object.entries(shared.codes ?? {})) {
    if (!Array.isArray(entry.scope) || entry.scope.length === 0) { errors.push(`operators/errors.json: ${id} needs a scope list`); continue; }
    if (entry.scope.length === 1 && entry.scope[0] !== '*') errors.push(`operators/errors.json: ${id} is scoped to one operator ${entry.scope[0]}; move it to operators/<id>/errors.json`);
    define(id, entry, entry.scope, 'operators/errors.json');
  }
  const opsDir = path.join(root, 'operators');
  const operatorIds = new Set();
  for (const e of await readdir(opsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const manifest = JSON.parse(await readFile(path.join(opsDir, e.name, 'operator.json'), 'utf8'));
    operatorIds.add(manifest.id);
    const local = path.join(opsDir, e.name, 'errors.json');
    if (!existsSync(local)) continue;
    const rel = `operators/${e.name}/errors.json`;
    const doc = JSON.parse(await readFile(local, 'utf8'));
    if (doc.schemaVersion !== 9) errors.push(`${rel}: schemaVersion must be 9`);
    for (const [id, entry] of Object.entries(doc.codes ?? {})) {
      if (entry.scope !== undefined) errors.push(`${rel}: ${id} must not carry scope; the file's operator is its scope`);
      define(id, entry, [manifest.id], rel);
    }
  }
  for (const [id, c] of Object.entries(codes)) for (const s of c.scope) if (s !== '*' && !operatorIds.has(s)) errors.push(`${c.home}: ${id} scope names ${s}, which is not an operator`);
  const allowed = (id, operatorId) => { const c = codes[id]; return Boolean(c) && (c.scope.includes('*') || c.scope.includes(operatorId)); };
  return { codes, errors, allowed, operatorIds };
}
```

## FILE: .claude/scripts/validate-workflows.mjs

SHA-256: f4eb5cbafd9172f3fe59ff8b99f4ff027de7bac5d486e63ef5b94cfd65e52c21

```javascript
// A workflow is a pre-composed chain of operators: an ordered list of steps, each step a list of
// branches that run in parallel. workflows/*.json are examples the entry may reuse when a request
// matches their `when`; otherwise the entry composes its own chain under the same rules this script
// enforces: every operator exists; every requirement preset names a declared field; every required
// Input of a branch is produced by an earlier step; branches of one step share no write alias; a loop
// goes back to an earlier step and carries a round cap; a chain that writes frontend source under
// mode apply audits and walks it before it publishes; the chain ends where it says it ends.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadOperatorPackages, cellAliases, kindOf, isYes } from './operator-md.mjs';
import { loadAliasRegistry, baseOf } from './alias-registry.mjs';

// Only a fully quoted cell is unquoted: a sentence that opens with a code span keeps its backticks.
const unquote = (s) => { const t = String(s ?? '').trim(); return /^`[^`]*`$/.test(t) ? t.slice(1, -1) : t; };

export async function validateWorkflows(root) {
  const errors = [];
  const packages = (await loadOperatorPackages(root)).filter((p) => p.shape === 'v9');
  const aliases = (await loadAliasRegistry(root)).aliases;
  // Fields the orchestrator fills from the session or the mission scope: neither preset nor asked (resources/orchestrator.json#agent.fills).
  const fills = new Set(JSON.parse(await readFile(path.join(root, 'resources', 'orchestrator.json'), 'utf8')).agent?.fills ?? []);
  const ops = new Map(packages.map((p) => {
    const op = p.en;
    const writes = new Set();
    for (const s of op.tables.steps?.rows ?? []) for (const a of cellAliases(s.writes)) writes.add(baseOf(aliases, a) ?? a);
    // The checkout roles the operator's required Context binds (@workspaces/fe, @workspaces/be, ...).
    const roles = new Set();
    for (const r of op.tables.context?.rows ?? []) { const a = cellAliases(r.alias)[0]; const m = a && /^@workspaces\/(fe|be)\b/.exec(a); if (m && isYes(r.required)) roles.add(m[1]); }
    return [p.manifest.id, {
      fields: new Set((op.tables.requirements?.rows ?? []).map((r) => unquote(r.field))),
      // Fields with no Default: the workflow presets them or declares under asks who supplies them before the branch starts.
      mustSupply: (op.tables.requirements?.rows ?? []).filter((r) => r.default.trim().startsWith('—')).map((r) => unquote(r.field)),
      required: (op.tables.inputs?.rows ?? []).filter((r) => isYes(r.required)).map((r) => kindOf(r.kind)),
      outputs: new Set((op.tables.outputs?.rows ?? []).map((r) => kindOf(r.kind))),
      next: new Set((op.tables.next?.rows ?? []).map((r) => unquote(r.operator))),
      roles,
      writes,
    }];
  }));
  const dir = path.join(root, 'workflows');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const ids = new Set();
  for (const file of files) {
    const rel = `workflows/${file}`;
    let wf; try { wf = JSON.parse(await readFile(path.join(dir, file), 'utf8')); } catch (e) { errors.push(`${rel}: ${e.message}`); continue; }
    if (wf.schemaVersion !== 9) errors.push(`${rel}: schemaVersion must be 9`);
    if (wf.id !== file.replace(/\.json$/, '')) errors.push(`${rel}: id must equal the file name`);
    if (ids.has(wf.id)) errors.push(`${rel}: duplicate id`); ids.add(wf.id);
    if (!wf.when?.en || !wf.when?.vi) errors.push(`${rel}: when.en and when.vi are required`);
    if (!Array.isArray(wf.chain) || wf.chain.length === 0) { errors.push(`${rel}: chain must be a non-empty array of steps`); continue; }
    const produced = new Set();
    const positions = new Map(); // operator -> first step index
    const boundRoles = new Set(); // workspace.bind roles bound by earlier steps
    let previousOps = null;
    wf.chain.forEach((step, n) => {
      // Adjacency: every operator of this step must be a Next of some operator of the previous step,
      // or the same operator re-entered (a resume or a second mode of the same job).
      if (Array.isArray(step) && previousOps) {
        for (const b of step) {
          const allowed = previousOps.some((prev) => prev === b.operator || (ops.get(prev)?.next ?? new Set()).has(b.operator));
          if (!allowed) errors.push(`${rel}: step ${n + 1} runs ${b.operator}, which no Next table of step ${n} (${previousOps.join(', ')}) permits`);
        }
      }
      if (!Array.isArray(step) || step.length === 0) { errors.push(`${rel}: step ${n + 1} must be a non-empty array of branches`); return; }
      if (step.length > 3) errors.push(`${rel}: step ${n + 1} has ${step.length} branches; at most 3 run in parallel`);
      const stepProduces = new Set();
      const seenWrites = new Map();
      step.forEach((b, m) => {
        const at = `${rel}: step ${n + 1} branch ${m + 1}`;
        const op = ops.get(b.operator);
        if (!op) { errors.push(`${at}: unknown operator ${b.operator}`); return; }
        if (!positions.has(b.operator)) positions.set(b.operator, n);
        for (const key of Object.keys(b.requirements ?? {})) if (!op.fields.has(key)) errors.push(`${at}: requirement ${key} is not a field of ${b.operator}`);
        for (const key of b.asks ?? []) { if (!op.fields.has(key)) errors.push(`${at}: asks ${key}, which is not a field of ${b.operator}`); else if (key in (b.requirements ?? {})) errors.push(`${at}: asks ${key} and presets it`); else if (fills.has(key)) errors.push(`${at}: asks ${key}, which the orchestrator fills`); }
        for (const key of op.mustSupply) if (!fills.has(key) && !(key in (b.requirements ?? {})) && !(b.asks ?? []).includes(key)) errors.push(`${at}: ${b.operator} requires ${key} (no Default); preset it or list it under asks`);
        for (const kind of op.required) if (!produced.has(kind)) errors.push(`${at}: ${b.operator} requires input ${kind}, which no earlier step produces`);
        // A required @workspaces/<role> context needs a workspace.bind of that role in an earlier step.
        if (b.operator !== 'workspace.bind') for (const role of op.roles) if (!boundRoles.has(role)) errors.push(`${at}: ${b.operator} requires @workspaces/${role}, which no earlier workspace.bind (role ${role}) bound`);
        if (b.fanout !== undefined && b.fanout !== 'matrix') errors.push(`${at}: fanout must be "matrix"`);
        if (b.maxParallel !== undefined && !(Number.isInteger(b.maxParallel) && b.maxParallel >= 1 && b.maxParallel <= 3)) errors.push(`${at}: maxParallel must be 1..3`);
        for (const w of op.writes) {
          if (seenWrites.has(w)) errors.push(`${at}: ${b.operator} and ${seenWrites.get(w)} both write ${w} in the same step; branches of one step must not share a write alias`);
          seenWrites.set(w, b.operator);
        }
        for (const k of op.outputs) stepProduces.add(k);
      });
      for (const k of stepProduces) produced.add(k);
      for (const b of step) if (b.operator === 'workspace.bind' && b.requirements?.role) boundRoles.add(b.requirements.role);
      previousOps = step.map((b) => b.operator);
    });
    for (const loop of wf.loops ?? []) {
      const from = positions.get(loop.from); const to = positions.get(loop.to);
      if (from === undefined || to === undefined) errors.push(`${rel}: loop names an operator outside the chain (${loop.from} → ${loop.to})`);
      else if (to >= from) errors.push(`${rel}: loop ${loop.from} → ${loop.to} must go back to an earlier step`);
      if (!(Number.isInteger(loop.maxRounds) && loop.maxRounds >= 1)) errors.push(`${rel}: loop ${loop.from} → ${loop.to} needs maxRounds ≥ 1`);
      if (!loop.when) errors.push(`${rel}: loop ${loop.from} → ${loop.to} needs a when`);
    }
    // The long-flow law: a chain that writes frontend source for real proves it before it publishes.
    // Between the write and the publish stand the audit that looked at the surface and the UAT that
    // walked it; a delivery nobody saw and nobody used is not a delivery, and mode dry writes nothing
    // so it owes nothing. A chain that publishes nothing is out of scope: there is no delivery yet.
    const applyStep = wf.chain.findIndex((s) => Array.isArray(s) && s.some((b) => b.operator === 'frontend.source.apply' && (b.requirements?.mode ?? 'apply') === 'apply'));
    const publishStep = positions.get('git.publish');
    if (applyStep !== -1 && publishStep !== undefined) {
      for (const owed of ['frontend.surface.audit', 'uat.verify']) {
        const at = positions.get(owed);
        if (at === undefined) errors.push(`${rel}: step ${applyStep + 1} writes frontend source under mode apply and step ${publishStep + 1} publishes it with no ${owed} anywhere in the chain; a surface nobody proved is not publishable`);
        else if (!(at > applyStep && at < publishStep)) errors.push(`${rel}: ${owed} runs at step ${at + 1}, outside the write at step ${applyStep + 1} and the publish at step ${publishStep + 1}; it proves nothing about what is being published`);
      }
    }

    const last = wf.chain[wf.chain.length - 1];
    const lastOps = Array.isArray(last) ? last.map((b) => b.operator) : [];
    if (wf.ends !== 'user' && !lastOps.includes(wf.ends)) errors.push(`${rel}: ends must be "user" or an operator of the last step (${lastOps.join(', ')})`);
  }
  // The README lists every example.
  const readme = await readFile(path.join(dir, 'README.md'), 'utf8');
  for (const id of ids) if (!readme.includes(`\`${id}\``)) errors.push(`workflows/README.md: does not list ${id}`);
  return { errors, count: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { errors, count } = await validateWorkflows(root);
  if (errors.length) { process.stderr.write(`${errors.join('\n')}\n`); process.exitCode = 1; } else process.stdout.write(`workflows closed: ${count} examples\n`);
}
```

## FILE: .claude/scripts/validate-routing.mjs

SHA-256: 86066a93b3317930062810ab7a0981cddb11f8ff44d982abb034e5b5e7ae3937

```javascript
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseOperatorMd, cellCodes } from './operator-md.mjs';
import { loadErrorsRegistry } from './errors-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const operatorsDir = path.join(root, 'operators');
const routing = JSON.parse(await readFile(path.join(root, 'routing.json'), 'utf8'));
const errors = [];

const kinds = new Set(Object.keys(routing.kinds));
const operators = new Map();
const registry = await loadErrorsRegistry(root);
errors.push(...registry.errors);

for (const entry of await readdir(operatorsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = path.join(operatorsDir, entry.name);
  const manifest = JSON.parse(await readFile(path.join(dir, 'operator.json'), 'utf8'));
  if (existsSync(path.join(dir, 'operator.md'))) {
    // An operator.md package emits exactly the domains of the stop codes its Stops table lists; `self`
    // is the operator's own domain, which routing.json answers with kind "resume".
    const op = parseOperatorMd(await readFile(path.join(dir, 'operator.md'), 'utf8'), 'en');
    const domains = new Set();
    for (const row of op.tables.stops?.rows ?? []) {
      const code = cellCodes(row.code)[0] ?? row.code.trim();
      const domain = registry.codes[code]?.domain;
      if (!domain) continue; // validate-operator reports the unknown code
      domains.add(domain === 'self' ? manifest.domain : domain);
    }
    operators.set(manifest.id, domains.size ? domains : null);
    continue;
  }
  const schema = await readFile(path.join(dir, 'output.schema.json'), 'utf8');
  const match = /"owningDomain"\s*:\s*\{[^}]*"enum"\s*:\s*(\[[^\]]*\])/s.exec(schema);
  operators.set(manifest.id, match ? new Set(JSON.parse(match[1])) : null);
}

// Every operator must have a route table, and the table must cover exactly the domains
// that operator can actually emit. A domain it can emit but cannot route is a dead end;
// a route for a domain it never emits is a rule nobody reaches.
for (const [id, domains] of operators) {
  const table = routing.routes[id];
  if (!table) {
    errors.push(`${id}: no route table`);
    continue;
  }
  if (domains === null) {
    errors.push(`${id}: output schema declares no owningDomain enum`);
    continue;
  }
  for (const domain of domains) {
    if (!Object.hasOwn(table, domain)) errors.push(`${id}: emits "${domain}" with no route`);
  }
  for (const domain of Object.keys(table)) {
    if (!domains.has(domain)) errors.push(`${id}: routes "${domain}" which it never emits`);
  }
}

for (const id of Object.keys(routing.routes)) {
  if (!operators.has(id)) errors.push(`routing.json names unknown operator ${id}`);
}

// A destination must resolve. An "operator" route needs a real target; the other kinds
// must not carry one, or the map would silently disagree with itself.
for (const [id, table] of Object.entries(routing.routes)) {
  for (const [domain, route] of Object.entries(table)) {
    if (!kinds.has(route.kind)) {
      errors.push(`${id}.${domain}: unknown kind ${route.kind}`);
      continue;
    }
    if (route.kind === 'operator') {
      if (!route.target) errors.push(`${id}.${domain}: operator route needs a target`);
      else if (!operators.has(route.target)) errors.push(`${id}.${domain}: targets unknown operator ${route.target}`);
      else if (route.target === id) errors.push(`${id}.${domain}: targets itself; use kind "resume"`);
    } else if (route.target !== undefined) {
      errors.push(`${id}.${domain}: kind ${route.kind} must not carry a target`);
    }
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  const routes = Object.values(routing.routes).reduce((total, table) => total + Object.keys(table).length, 0);
  process.stdout.write(`routing map closed: ${operators.size} operators, ${routes} routes\n`);
}
```

## FILE: .claude/scripts/validate-request.mjs

SHA-256: 4d68d60678f155af90f2772daa22bd87e0128c390e29dffd1e7612e48ab9291f

```javascript
// The request half of one branch (step-N/parallel-M/request/request.json), checked before any agent
// runs: the gate schema; the operator exists and is an operator.md package; every requirement key is
// one the operator declares and every required one (Default —) has a value; every declared input is
// present when required, points inside the session, and the file exists; a nested exchange's request
// names an exchange the operator's Outputs declare. A request that fails here is the orchestrator's
// or the person's mistake, never the agent's.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { validateAgainst } from './json-schema.mjs';
import { loadOperatorPackages, kindOf, isYes, exchangeOf } from './operator-md.mjs';
import { loadInteractionPolicy, selectionErrors } from './validate-interaction.mjs';
import { validateImportedInput } from './producer-import.mjs';

// Only a fully quoted cell is unquoted: a sentence that opens with a code span keeps its backticks.
const unquote = (s) => { const t = String(s ?? '').trim(); return /^`[^`]*`$/.test(t) ? t.slice(1, -1) : t; };
export const isRequiredField = (row) => row.default.trim().startsWith('—');
export const isEmpty = (v) => v === undefined || v === null || v === '' || v === '—';

// A branch dir is <session>/step-N/parallel-M; an exchange dir is <branch>/<exchange>.
export function sessionRootOf(dir) {
  let cur = path.resolve(dir);
  for (let i = 0; i < 4; i += 1) { if (/^step-\d+$/.test(path.basename(cur))) return path.dirname(cur); cur = path.dirname(cur); }
  return null;
}

// The host repository that owns this tree: the stacks live beside the tree, never inside it.
export const hostRootOf = (root) => path.resolve(root, '..');

// An `env` requirement names one stack of the installation. The names are read from the folder, never
// listed here: a tree installed beside another set of stacks must accept that set, and a hard-coded
// vocabulary would be a second home for something the filesystem already publishes. A machine with no
// stacks at all checks nothing, because there is nothing to check against.
export function missingStack(root, env, hostRoot = hostRootOf(root)) {
  if (isEmpty(env)) return null;
  const stacks = path.join(hostRoot, '.stacks');
  if (!existsSync(stacks)) return null;
  return existsSync(path.join(stacks, String(env))) ? null : `.stacks/${env}`;
}

// What an environment declares about itself lives in its folder, in the shape the environment schema
// gives; the classes an operation can fall under, the defaults an omitted class takes and the shape of
// a reference to the declaration are all read from that schema, so a gate carries no copy of them.
const ENVIRONMENT_SCHEMA = path.join('readiness', 'initialization', 'stacks', 'environment.schema.json');
export async function loadEnvironmentSchema(root) {
  return JSON.parse(await readFile(path.join(root, ENVIRONMENT_SCHEMA), 'utf8'));
}
// An approval that names a declaration does so by path and content hash; anything else is an id.
export function parseDeclarationReference(schema, value) {
  if (typeof value !== 'string') return null;
  const m = new RegExp(schema.$defs.reference.pattern).exec(value);
  return m ? { env: m[1], hash: m[2] } : null;
}
export const declarationPath = (env) => `.stacks/${env}/environment.json`;
// Reads one environment's declaration as it stands on disk: its bytes hashed, its shape checked
// against the schema, and its authorization completed with the defaults its production flag selects.
export async function stackDeclaration(root, env, hostRoot = hostRootOf(root), schema = null) {
  schema ??= await loadEnvironmentSchema(root);
  const rel = declarationPath(env);
  const file = path.join(hostRoot, rel);
  const out = { rel, file, exists: existsSync(file), hash: null, reference: null, declaration: null, authorization: null, errors: [] };
  if (!out.exists) return out;
  const bytes = await readFile(file);
  out.hash = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  out.reference = `${rel}#${out.hash}`;
  try { out.declaration = JSON.parse(bytes.toString('utf8')); } catch (e) { out.errors.push(`${rel}: ${e.message}`); return out; }
  out.errors.push(...validateAgainst(schema, out.declaration, rel));
  if (out.declaration?.env !== undefined && out.declaration.env !== env) out.errors.push(`${rel}: declares env ${out.declaration.env} inside the ${env} folder`);
  if (out.errors.length) return out;
  const defaults = schema.$defs.defaults[out.declaration.production ? 'production' : 'non-production'];
  out.authorization = { ...defaults, ...(out.declaration.authorization ?? {}) };
  return out;
}

export async function validateRequest(root, dir, packages) {
  const errors = [];
  if(existsSync(path.join(dir,'import.json')))return {errors:['request.json: an imported producer slot is evidence-only and cannot execute an operator'],request:null};
  const rel = (f) => path.relative(sessionRootOf(dir) ?? dir, path.join(dir, f)).split(path.sep).join('/');
  const file = path.join(dir, 'request', 'request.json');
  if (!existsSync(file)) return { errors: [`${rel('request/request.json')}: missing`], request: null };
  let request; try { request = JSON.parse(await readFile(file, 'utf8')); } catch (e) { return { errors: [`${rel('request/request.json')}: ${e.message}`], request: null }; }
  const schema = JSON.parse(await readFile(path.join(root, 'templates', 'step', 'request.schema.json'), 'utf8'));
  errors.push(...validateAgainst(schema, request, rel('request/request.json')));
  packages ??= await loadOperatorPackages(root);
  const pkg = packages.find((p) => p.manifest.id === request.operatorId);
  if (!pkg) { errors.push(`request.json: unknown operator ${request.operatorId}`); return { errors, request }; }
  if (pkg.shape !== 'v9') { errors.push(`${request.operatorId} is not an operator.md package`); return { errors, request }; }
  const op = pkg.en;
  const sessionRoot = sessionRootOf(dir);
  let recordedChoices = {};

  if (request.exchange) {
    // A nested exchange: it must be one the operator's Outputs declare, and it carries no person-facing requirements.
    const declared = (op.tables.outputs?.rows ?? []).map((r) => exchangeOf(unquote(r.file))).filter(Boolean);
    if (!declared.includes(request.exchange)) errors.push(`request.json: exchange ${request.exchange} is not declared by an Output of ${op.id}`);
    if (Object.keys(request.requirements ?? {}).length) errors.push('request.json: a nested exchange carries no requirements');
  } else {
    const declared = new Map((op.tables.requirements?.rows ?? []).map((r) => [unquote(r.field), r]));
    for (const key of Object.keys(request.requirements ?? {})) if (!declared.has(key)) errors.push(`request.json: requirements.${key} is not a field ${op.id} declares`);
    for (const [key, row] of declared) if (isRequiredField(row) && isEmpty(request.requirements?.[key])) errors.push(`request.json: required field ${key} has no value`);
    const declaredInputs = new Map((op.tables.inputs?.rows ?? []).map((r) => [kindOf(r.kind), r]));
    for (const kind of Object.keys(request.inputs ?? {})) if (!declaredInputs.has(kind)) errors.push(`request.json: inputs.${kind} is not an Input ${op.id} declares`);
    for (const [kind, row] of declaredInputs) if (isYes(row.required) && isEmpty(request.inputs?.[kind])) errors.push(`request.json: required input ${kind} is absent`);
  }
  for (const [kind, p] of Object.entries(request.inputs ?? {})) {
    if (!sessionRoot) { errors.push(`request.json: inputs.${kind} cannot be resolved; the branch is not under a session`); continue; }
    if (!existsSync(path.join(sessionRoot, p))) errors.push(`request.json: inputs.${kind} = ${p} does not exist in the session`);
    errors.push(...await validateImportedInput(root,sessionRoot,p,kind,{receivingSessionId:request.sessionId}));
  }
  // The orchestrator hashes every request into state.json; a request that changed since is tampering.
  if (sessionRoot && existsSync(path.join(sessionRoot, 'state.json'))) {
    try {
      const state = JSON.parse(await readFile(path.join(sessionRoot, 'state.json'), 'utf8'));
      recordedChoices = state.choices ?? {};
      errors.push(...validateAgainst(JSON.parse(await readFile(path.join(root, 'templates', 'step', 'state.schema.json'), 'utf8')), state, 'state.json'));
      // A resume re-enters the same operator and names a branch state.json knows; a re-entry state.json does not record is unrecorded evidence.
      if (request.resume) {
        const target = `${request.resume.step}/${request.resume.parallel}`;
        if (state.steps?.[target] === undefined) errors.push(`request.json: resume names ${target}, which state.json does not record`);
        else if (state.steps[target] !== request.operatorId) errors.push(`request.json: resume names ${target}, a ${state.steps[target]} branch, but this request runs ${request.operatorId}`);
        const mine = `${request.step}/${request.parallel}`;
        if (state.resumes && !state.resumes[mine]) errors.push(`request.json: state.json records no resumes[${mine}] for this re-entry`);
        else if (state.resumes?.[mine] && state.resumes[mine].resumes !== target) errors.push(`request.json: state.json resumes[${mine}] names ${state.resumes[mine].resumes}, the request names ${target}`);
      }
      const key = `${request.step}/${request.parallel}${request.exchange ? `/${request.exchange}` : ''}`;
      const expected = state.requestHashes?.[key];
      if (expected) {
        const { createHash } = await import('node:crypto');
        const actual = `sha256:${createHash('sha256').update(await readFile(file)).digest('hex')}`;
        if (actual !== expected) errors.push(`request.json: hash ${actual} differs from state.json requestHashes[${key}]`);
      }
    } catch (e) { errors.push(`state.json: ${e.message}`); }
  }
  errors.push(...selectionErrors(await loadInteractionPolicy(root), request, recordedChoices));
  if (!errors.length && request.operatorId === 'workspace.bind' && !request.exchange) {
    const { validateWorkspaceCheckoutRequest } = await import('./workspace-checkout.mjs');
    errors.push(...validateWorkspaceCheckoutRequest(root, request, dir));
  }
  if (!errors.length && request.operatorId === 'backend.source.apply') {
    const { validateMigrationContract } = await import('./migration-contract.mjs');
    errors.push(...(await validateMigrationContract(root, dir, request)).errors);
  }
  if (!errors.length && request.operatorId === 'release.deploy' && request.requirements?.migration != null) {
    const { validateMigrationReleaseRequest } = await import('./migration-release.mjs');
    errors.push(...(await validateMigrationReleaseRequest(root, dir, request)).errors);
  }
  return { errors, request, pkg };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const target = process.argv[2];
  if (!target) { process.stderr.write('usage: node scripts/validate-request.mjs <session>/step-N/parallel-M[/<exchange>]\n'); process.exit(2); }
  validateRequest(root, path.resolve(target)).then(({ errors }) => {
    if (errors.length) { process.stderr.write(`${errors.join('\n')}\n`); process.exitCode = 1; } else process.stdout.write('request valid\n');
  }, (error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
```

## FILE: .claude/scripts/validate-response.mjs

SHA-256: 7c5c7fb57da61ce9a4f8610d13d1e8f4ce3214e830d66a221057a83d431b950d

```javascript
// The response half of one branch (step-N/parallel-M/response/), checked after the agent stops: the
// gate schema; every Output the operator's operator.md declares is present when required and valid
// when present (markdown kinds through templates/kinds/<kind>.contract.json, data kinds through
// <kind>.schema.json, artifacts by existence); a blocked stop is a code the operator may emit whose
// effective disposition is terminate; a taken fallback is one whose effective disposition is fallback
// and is recorded under ## Fallbacks taken; a waiting status names a declared exchange; a nested
// exchange's own response is checked the same way. Effective means after `unless` is evaluated
// against request.json requirements. Operator-specific law lives in operators/<id>/validate.mjs.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { validateAgainst } from './json-schema.mjs';
import { checkDocument, loadKindTemplates } from './validate-templates.mjs';
import { loadOperatorPackages, kindOf, isYes, exchangeOf } from './operator-md.mjs';
import { loadErrorsRegistry } from './errors-registry.mjs';
import { sessionRootOf } from './validate-request.mjs';
import { loadInteractionPolicy, interactionErrors } from './validate-interaction.mjs';

// Only a fully quoted cell is unquoted: a sentence that opens with a code span keeps its backticks.
const unquote = (s) => { const t = String(s ?? '').trim(); return /^`[^`]*`$/.test(t) ? t.slice(1, -1) : t; };

// Rows of the first table under `## <heading>`, cells unquoted.
export function tableUnder(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return null;
  const rows = [];
  let inTable = false;
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i += 1) {
    if (lines[i].startsWith('|') && /^\|\s*-{3,}/.test(lines[i + 1] ?? '')) { inTable = true; i += 1; continue; }
    if (inTable) { if (!lines[i].startsWith('|')) break; rows.push(lines[i].split('|').slice(1, -1).map((c) => unquote(c))); }
  }
  return rows;
}
// Whether a response hands the mission to a person: a blocked response routes by the domain of its
// stop through routing.json, a done one may name `user` in next. Both are read from the files that
// publish them, so the map keeps one home.
export async function userRouted(root, registry, operatorId, response) {
  if ((response?.next ?? []).includes('user')) return true;
  if (response?.status !== 'blocked') return false;
  const entry = registry?.codes?.[response.stop];
  if (!entry || entry.domain === 'self') return false;
  const routing = JSON.parse(await readFile(path.join(root, 'routing.json'), 'utf8'));
  return routing.routes?.[operatorId]?.[entry.domain]?.kind === 'user';
}

// The candidates a ## Printed table put in front of the person, keyed by candidate id with the
// viewports each was printed at. A candidate row is a served page `<candidateId>.html?viewport=<name>`
// or a capture `<candidateId>.<name>.png`, wherever it lives; a row of any other shape (the sheet, a
// worst capture per topic, a run summary) is not a candidate and is not counted.
export function printedCandidates(rows) {
  const out = new Map();
  for (const [artifact] of rows ?? []) {
    const cell = String(artifact ?? '').replace(/^`|`$/g, '');
    const [file, query = ''] = cell.split('?');
    const base = file.replace(/^.*\//, '');
    let id = null;
    let viewport = null;
    const q = /(?:^|&)viewport=([A-Za-z0-9-]+)/.exec(query);
    if (q && /\.html$/.test(base)) { id = base.replace(/\.html$/, ''); viewport = q[1]; }
    else { const m = /^([a-z0-9][a-z0-9-]*)\.([a-z0-9][a-z0-9-]*)\.png$/.exec(base); if (m) { id = m[1]; viewport = m[2]; } }
    if (!id) continue;
    if (!out.has(id)) out.set(id, new Set());
    out.get(id).add(viewport);
  }
  return out;
}

// @tools/print, decision-points: a design decision handed to a person reaches them as rendered
// candidates they pick by eye, never as prose alternatives. `options` are the ids the person is
// asked to choose between (every one must be printed), `minimum` is the floor for a composition or
// taste choice, `viewports` is how many captures each candidate carries, and `reason` is the stop's
// message, which names the sheet and asks one question and nothing more.
export function choiceHandoffErrors({ at, printedRows, options = [], minimum = options.length, viewports = 2, reason }) {
  const errors = [];
  const candidates = printedCandidates(printedRows);
  const needed = Math.max(minimum, options.length);
  if (candidates.size === 0) errors.push(`${at}: the choice is handed to the person as prose; ## Printed lists no rendered candidate, and a design decision reaches a person as rendered candidates they pick by eye`);
  for (const option of options) if (!candidates.has(option)) errors.push(`${at}: option ${option} is offered and never printed; every option the person is asked to choose between is a rendered candidate under ## Printed`);
  if (candidates.size && candidates.size < needed) errors.push(`${at}: ## Printed shows ${candidates.size} rendered candidate(s) for a choice of ${needed}; a composition or taste choice puts at least ${minimum} in front of the person and never fewer than the options`);
  for (const [id, seen] of candidates) if (seen.size < viewports) errors.push(`${at}: candidate ${id} is printed at ${seen.size} viewport(s) of ${viewports}; every candidate carries a capture per viewport`);
  const text = String(reason ?? '');
  if (!text.trim()) errors.push('response/response.json: a choice handed to a person carries a reason: the sheet URL and one question');
  else {
    if (/[\r\n]/.test(text)) errors.push('response/response.json: reason spans more than one line; the message to the person is the sheet URL and one question');
    if (!/https?:\/\/\S+/.test(text)) errors.push('response/response.json: reason names no served URL; the person is told where the candidates are, not what they look like');
    // One sentence, and that sentence a question: a clause that describes the options before asking
    // is the narration the print law refuses.
    const prose = text.replace(/https?:\/\/\S+/g, '').trim();
    const sentences = prose.split(/[.;!?]\s+|[.;!?]$/).filter((s) => s.trim()).length;
    if (sentences !== 1 || !/\?$/.test(prose)) errors.push('response/response.json: reason is not one question ending in "?"; the options are printed, not narrated');
  }
  return errors;
}

function patternOf(fileCell) {
  const esc = unquote(fileCell).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/<[^>]+>/g, '[A-Za-z0-9_.-]+');
  return new RegExp(`^${esc}$`);
}
export function effectiveDisposition(entry, requirements) {
  if (entry.unless && String(requirements?.[entry.unless.param] ?? '') === String(entry.unless.equals)) return entry.unless.then;
  return entry.disposition;
}

// `dir` is the branch (or exchange) folder; `requirements` come from the branch's request.json.
export async function validateResponse(root, dir, { requirements = {}, exchange = null, packages, kinds, registry } = {}) {
  const errors = [];
  const rel = (f) => path.relative(sessionRootOf(dir) ?? dir, path.join(dir, f)).split(path.sep).join('/');
  const file = path.join(dir, 'response', 'response.json');
  if (!existsSync(file)) return { errors: [`${rel('response/response.json')}: missing`], response: null, present: new Set() };
  let response; try { response = JSON.parse(await readFile(file, 'utf8')); } catch (e) { return { errors: [`${rel('response/response.json')}: ${e.message}`], response: null, present: new Set() }; }
  const schema = JSON.parse(await readFile(path.join(root, 'templates', 'step', 'response.schema.json'), 'utf8'));
  errors.push(...validateAgainst(schema, response, rel('response/response.json')));
  const stateFile = path.join(sessionRootOf(dir) ?? dir, 'state.json');
  let choices = {};
  if (existsSync(stateFile)) {
    try { choices = JSON.parse(await readFile(stateFile, 'utf8')).choices ?? {}; }
    catch (e) { errors.push(`state.json: ${e.message}`); }
  }
  errors.push(...interactionErrors(await loadInteractionPolicy(root), response.interaction, choices, response.status));
  if (response.status !== 'blocked' && response.stop !== undefined) errors.push(`${rel('response/response.json')}: only a blocked response carries a stop`);
  if (response.status !== 'waiting' && response.awaiting !== undefined) errors.push(`${rel('response/response.json')}: only a waiting response carries awaiting`);
  if ((response.exchange ?? null) !== exchange) errors.push(`${rel('response/response.json')}: exchange ${response.exchange ?? 'none'} does not match the folder ${exchange ?? 'none'}`);
  packages ??= await loadOperatorPackages(root);
  const pkg = packages.find((p) => p.manifest.id === response.operatorId);
  if (!pkg) { errors.push(`response.json: unknown operator ${response.operatorId}`); return { errors, response, present: new Set() }; }
  if (pkg.shape !== 'v9') { errors.push(`${response.operatorId} is not an operator.md package`); return { errors, response, present: new Set() }; }
  kinds ??= await loadKindTemplates(root);
  registry ??= await loadErrorsRegistry(root);
  errors.push(...registry.errors);
  const op = pkg.en;

  // Which Outputs belong to this folder: the branch owns files without an exchange prefix, an exchange owns its own.
  const outputs = (op.tables.outputs?.rows ?? []).filter((r) => exchangeOf(unquote(r.file)) === exchange);
  const present = new Set();
  for (const row of outputs) {
    const kind = kindOf(row.kind);
    const type = row.type.trim();
    // Inside an exchange folder the declared file is <exchange>/response/x; the response.json there lists response/x.
    const declaredFile = exchange ? unquote(row.file).replace(`${exchange}/`, '') : unquote(row.file);
    const value = response.fields?.[kind];
    const files = value === undefined ? [] : Array.isArray(value) ? value : [value];
    if (files.length === 0) { if (isYes(row.required) && response.status === 'done') errors.push(`${rel('response/response.json')}: required output ${kind} is not in fields`); continue; }
    present.add(kind);
    const re = patternOf(declaredFile);
    for (const f of files) {
      if (!re.test(f)) errors.push(`${rel('response/response.json')}: fields.${kind} = ${f} does not match the declared file ${declaredFile}`);
      const full = path.join(dir, f);
      if (!existsSync(full)) { errors.push(`${rel(f)}: listed in response.json but missing`); continue; }
      if (type === 'md') {
        const contract = kinds.get(kind);
        if (!contract) { errors.push(`templates/kinds/${kind}.contract.json: missing`); continue; }
        errors.push(...checkDocument(rel(f), await readFile(full, 'utf8'), contract, 'en'));
      } else if (type === 'data') {
        const schemaPath = path.join(root, 'templates', 'kinds', `${kind}.schema.json`);
        if (!existsSync(schemaPath)) { errors.push(`templates/kinds/${kind}.schema.json: missing`); continue; }
        let value2; try { value2 = JSON.parse(await readFile(full, 'utf8')); } catch (e) { errors.push(`${rel(f)}: ${e.message}`); continue; }
        errors.push(...validateAgainst(JSON.parse(await readFile(schemaPath, 'utf8')), value2, rel(f)));
      }
    }
  }
  for (const kind of Object.keys(response.fields ?? {})) if (!outputs.some((r) => kindOf(r.kind) === kind)) errors.push(`${rel('response/response.json')}: fields.${kind} is not an Output of ${op.id}${exchange ? ` in exchange ${exchange}` : ''}`);

  // Stops, fallbacks, waiting.
  const stopsTable = new Set((op.tables.stops?.rows ?? []).map((r) => unquote(r.code)));
  const dispositionOf = (code) => { const e = registry.codes[code]; return e && registry.allowed(code, op.id) ? effectiveDisposition(e, requirements) : null; };
  if (response.status === 'blocked') {
    const d = dispositionOf(response.stop);
    // UNKNOWN_STOP is the one code no operator declares: the orchestrator writes it when it meets a code the merged registry does not list.
    if (response.stop !== 'UNKNOWN_STOP' && !stopsTable.has(response.stop)) errors.push(`${rel('response/response.json')}: stop ${response.stop} is not in the Stops table of ${op.id}`);
    if (d === null) errors.push(`${rel('response/response.json')}: stop ${response.stop} is not a registered code ${op.id} may emit`);
    else if (d !== 'terminate') errors.push(`${rel('response/response.json')}: ${response.stop} has disposition fallback under these requirements; the step should have continued`);
  }
  for (const code of response.fallbacks ?? []) {
    const d = dispositionOf(code);
    if (!stopsTable.has(code)) errors.push(`${rel('response/response.json')}: fallback ${code} is not in the Stops table of ${op.id}`);
    if (d === null) errors.push(`${rel('response/response.json')}: fallback ${code} is not a registered code ${op.id} may emit`);
    else if (d !== 'fallback') errors.push(`${rel('response/response.json')}: ${code} has disposition terminate under these requirements; it cannot be taken as a fallback`);
  }
  if (response.status === 'waiting') {
    const declared = (op.tables.outputs?.rows ?? []).filter((r) => exchangeOf(unquote(r.file)) === response.awaiting?.exchange);
    if (!declared.length) errors.push(`${rel('response/response.json')}: awaiting exchange ${response.awaiting?.exchange} is declared by no Output of ${op.id}`);
    else if (!declared.some((r) => kindOf(r.kind) === response.awaiting?.kind)) errors.push(`${rel('response/response.json')}: awaiting kind ${response.awaiting?.kind} is not produced by exchange ${response.awaiting?.exchange}`);
  }
  const mainMd = outputs.find((r) => /\/response\.md$/.test(unquote(r.file)));
  if (mainMd && present.has(kindOf(mainMd.kind))) {
    const text = await readFile(path.join(dir, 'response', 'response.md'), 'utf8');
    const taken = (tableUnder(text, '## Fallbacks taken') ?? []).map(([c]) => c);
    const declaredTaken = new Set(response.fallbacks ?? []);
    for (const c of taken) if (!declaredTaken.has(c)) errors.push(`${rel('response/response.md')}: Fallbacks taken lists ${c}, which response.json does not`);
    for (const c of declaredTaken) if (!taken.includes(c)) errors.push(`${rel('response/response.json')}: fallback ${c} is not recorded under ## Fallbacks taken in response.md`);
  }
  // next names only what the operator's own Next table offers (or user / external); a workflow cannot add a hand-off the operator does not declare.
  const nextTable = new Set((op.tables.next?.rows ?? []).map((r) => unquote(r.operator)));
  for (const nextId of response.next ?? []) {
    if (nextId === 'user' || nextId === 'external') continue;
    if (!packages.some((p) => p.manifest.id === nextId)) errors.push(`${rel('response/response.json')}: next names unknown operator ${nextId}`);
    else if (!nextTable.has(nextId)) errors.push(`${rel('response/response.json')}: next names ${nextId}, which the Next table of ${op.id} does not offer`);
  }
  // A stand-in is recorded as a pair: the profile operator.json binds and the profile that actually ran.
  if ((response.boundProfile === undefined) !== (response.ranProfile === undefined)) errors.push(`${rel('response/response.json')}: boundProfile and ranProfile are recorded together or not at all`);
  if (response.boundProfile !== undefined && response.boundProfile !== pkg.manifest.resources?.profile) errors.push(`${rel('response/response.json')}: boundProfile ${response.boundProfile} is not the profile ${op.id} binds (${pkg.manifest.resources?.profile})`);
  if (exchange && (response.next ?? []).length) errors.push(`${rel('response/response.json')}: a nested exchange does not route; next must be empty`);
  return { errors, response, present, pkg };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const target = process.argv[2];
  if (!target) { process.stderr.write('usage: node scripts/validate-response.mjs <session>/step-N/parallel-M[/<exchange>]\n'); process.exit(2); }
  const dir = path.resolve(target);
  // A branch is <session>/step-N/parallel-M (its parent is step-N); an exchange is <branch>/<exchange> (its parent is parallel-M).
  const exchange = /^step-\d+$/.test(path.basename(path.dirname(dir))) ? null : path.basename(dir);
  const run = async () => {
    let requirements = {};
    const reqFile = path.join(exchange ? path.dirname(dir) : dir, 'request', 'request.json');
    if (existsSync(reqFile)) requirements = JSON.parse(await readFile(reqFile, 'utf8')).requirements ?? {};
    return validateResponse(root, dir, { requirements, exchange });
  };
  run().then(({ errors }) => {
    if (errors.length) { process.stderr.write(`${errors.join('\n')}\n`); process.exitCode = 1; } else process.stdout.write('response valid\n');
  }, (error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
```

## FILE: .claude/scripts/validate-step.mjs

SHA-256: f7a5d168f0d8787e4ee4bc2b608adb11d971e30b25e63a55647f35d9b025eb10

```javascript
// One branch of one step, both halves: validate-request on request/request.json, validate-response on
// response/, and the same pair on every nested exchange folder the response awaited or the operator
// declares. Used by operator self-tests and audits; the orchestrator runs the halves separately, the
// request before it spawns the agent and the response after.
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { validateRequest } from './validate-request.mjs';
import { validateResponse } from './validate-response.mjs';
import { loadOperatorPackages, exchangeOf } from './operator-md.mjs';
import { loadKindTemplates } from './validate-templates.mjs';
import { loadErrorsRegistry } from './errors-registry.mjs';

// Only a fully quoted cell is unquoted: a sentence that opens with a code span keeps its backticks.
const unquote = (s) => { const t = String(s ?? '').trim(); return /^`[^`]*`$/.test(t) ? t.slice(1, -1) : t; };

export async function validateStep(root, branchDir) {
  const packages = await loadOperatorPackages(root);
  const kinds = await loadKindTemplates(root);
  const registry = await loadErrorsRegistry(root);
  const req = await validateRequest(root, branchDir, packages);
  const errors = [...req.errors];
  const requirements = req.request?.requirements ?? {};
  const res = await validateResponse(root, branchDir, { requirements, exchange: null, packages, kinds, registry });
  errors.push(...res.errors);
  const present = new Set(res.present);
  const pkg = req.pkg ?? res.pkg;
  if (pkg?.shape === 'v9') {
    const exchanges = new Set((pkg.en.tables.outputs?.rows ?? []).map((r) => exchangeOf(unquote(r.file))).filter(Boolean));
    for (const ex of exchanges) {
      const exDir = path.join(branchDir, ex);
      if (!existsSync(path.join(exDir, 'request', 'request.json'))) { if (res.response?.status === 'done') errors.push(`${ex}/: the operator declares this exchange and the branch is done, but it never ran`); continue; }
      const exReq = await validateRequest(root, exDir, packages);
      errors.push(...exReq.errors);
      const exRes = await validateResponse(root, exDir, { requirements, exchange: ex, packages, kinds, registry });
      errors.push(...exRes.errors);
      for (const k of exRes.present) present.add(k);
      if (res.response?.status === 'done' && exRes.response?.status !== 'done') errors.push(`${ex}/response/response.json: the branch is done but the exchange is ${exRes.response?.status ?? 'missing'}`);
    }
  }
  return { errors, request: req.request, response: res.response, requirements, present, pkg };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const target = process.argv[2];
  if (!target) { process.stderr.write('usage: node scripts/validate-step.mjs <session>/step-N/parallel-M\n'); process.exit(2); }
  const { errors } = await validateStep(root, path.resolve(target));
  if (errors.length) { process.stderr.write(`${errors.join('\n')}\n`); process.exitCode = 1; } else process.stdout.write('step valid\n');
}
```

## FILE: .claude/scripts/validate-interaction.mjs

SHA-256: 98fbd741fddba2acd173c0d088bb42a38a03db2c0459e12fdf32953bf9909059

```javascript
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { validateAgainst } from './json-schema.mjs';

export const loadInteractionPolicy = async (root) => JSON.parse(await readFile(path.join(root, 'resources/interaction.json'), 'utf8'));

export function interactionErrors(policy, interaction, choices = {}, status = 'blocked') {
  if (interaction === undefined) return [];
  const errors = [];
  if (status !== 'blocked') errors.push('interaction: an unanswered choice is blocked, never a done result');
  if (!policy.questionKinds.includes(interaction?.kind)) errors.push('interaction: only a tier-choice may ask the user');
  const options = interaction?.options;
  if (!Array.isArray(options) || options.length < policy.minOptions || options.length > policy.maxOptions) errors.push(`interaction: a tier choice has ${policy.minOptions}–${policy.maxOptions} material options`);
  if (Array.isArray(options)) {
    for (const key of ['id', 'label', 'tradeoff']) {
      if (options.some((option) => typeof option?.[key] !== 'string' || !option[key].trim())) errors.push(`interaction: every option needs ${key}`);
      if (new Set(options.map((option) => typeof option?.[key] === 'string' ? option[key].trim() : undefined)).size !== options.length) errors.push(`interaction: options need distinct ${key} values`);
    }
  }
  if (typeof interaction?.decisionId !== 'string' || !interaction.decisionId.trim()) errors.push('interaction: a stable decisionId is required');
  if (Object.hasOwn(choices ?? {}, interaction?.decisionId ?? '')) errors.push('interaction: this decision already has a user choice; reuse it without asking again');
  return errors;
}

export function selectionErrors(policy, request, choices = {}) {
  if (request.decisionId === undefined && request.selectedOption === undefined) return [];
  const choice = Object.hasOwn(choices ?? {}, request.decisionId ?? '') ? choices[request.decisionId] : null;
  if (!request.decisionId || !request.selectedOption || !choice) return ['request: a selected tier needs the actual user choice in state.json.choices'];
  const errors = [];
  if (choice.selectedBy !== policy.selectionSource || typeof choice.sourceRef !== 'string' || !choice.sourceRef.trim()) errors.push('request: a tier is selected by the user with a sourceRef to their message, never defaulted by an agent');
  if (choice.selected !== request.selectedOption) errors.push('request: selectedOption differs from the recorded user choice');
  return errors;
}

// A legacy user route names an owner; it is not itself a question or an operation grant.
export function interactionDisposition(route, interaction) {
  if (interaction) return 'tier-choice';
  if (route?.kind === 'user') return 'owner-handoff';
  if (route?.kind === 'external') return 'blocked-report';
  return 'continue';
}

export async function branchInteraction(root, dir) {
  const response = JSON.parse(await readFile(path.join(dir, 'response/response.json'), 'utf8'));
  // Find the session for both ordinary and nested-exchange branches.
  let parent = path.resolve(dir);
  while (!/^step-\d+$/.test(path.basename(parent)) && path.dirname(parent) !== parent) parent = path.dirname(parent);
  const stateFile = path.join(path.dirname(parent), 'state.json');
  const state = existsSync(stateFile) ? JSON.parse(await readFile(stateFile, 'utf8')) : {};
  const schema = JSON.parse(await readFile(path.join(root, 'templates/step/response.schema.json'), 'utf8'));
  const errors = response.interaction === undefined ? [] : validateAgainst(schema.properties.interaction, response.interaction, 'interaction');
  return [...errors, ...interactionErrors(await loadInteractionPolicy(root), response.interaction, state.choices, response.status ?? null)];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  if (!process.argv[2]) { process.stderr.write('usage: node scripts/validate-interaction.mjs <branch>\n'); process.exitCode = 2; }
  else {
    const errors = await branchInteraction(root, path.resolve(process.argv[2]));
    if (errors.length) { process.stderr.write(errors.join('\n') + '\n'); process.exitCode = 1; }
    else process.stdout.write('interaction valid\n');
  }
}
```

## FILE: .claude/scripts/producer-import.mjs

SHA-256: dcff9b4b32ad7b642b2f50db291d180d4b8aded26be0c09fe00482b4b5bef7f5

```javascript
import { existsSync, lstatSync, realpathSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOperatorPackages, kindOf } from './operator-md.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ID=/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const hash=b=>'sha256:'+createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const positive=v=>Number.isSafeInteger(v)&&v>0;
const safeRelative=p=>typeof p==='string'&&p.length>0&&!path.isAbsolute(p)&&!path.win32.isAbsolute(p)&&!/[\\:\0]/.test(p)&&!p.split('/').some(s=>!s||s==='.'||s==='..');
function within(base,relative,{missing=false}={}){
  if(!safeRelative(relative))throw Error('unsafe import path');
  let current=base;
  for(const piece of relative.split('/')){
    current=path.join(current,piece);
    if(!existsSync(current)){if(missing)continue;throw Error('import file is missing');}
    if(lstatSync(current).isSymbolicLink())throw Error('import symlinks are forbidden');
    const rel=path.relative(realpathSync(base),realpathSync(current));
    if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('import realpath escaped its root');
  }
  return current;
}
function roots(hostRoot,sourceSessionId,targetSessionId,sourceStep,sourceParallel,targetStep,targetParallel){
  if(!ID.test(sourceSessionId)||!ID.test(targetSessionId)||sourceSessionId===targetSessionId||![sourceStep,sourceParallel,targetStep,targetParallel].every(positive))throw Error('import session IDs and coordinates must be strict and distinct');
  const sessions=within(hostRoot,'.worktrees/sessions');
  const sourceSession=within(sessions,sourceSessionId),targetSession=within(sessions,targetSessionId);
  const source=within(sourceSession,`step-${sourceStep}/parallel-${sourceParallel}`);
  const target=within(targetSession,`step-${targetStep}/parallel-${targetParallel}`,{missing:true});
  return {sourceSession,targetSession,source,target};
}
function evidenceOnly(targetSession,step,parallel){
  const state=json(within(targetSession,'state.json')),key=`${step}/${parallel}`;
  if(state.steps?.[key]!==undefined||state.requestHashes?.[key]!==undefined||state.current===key||(state.chain??[]).flat(Infinity).includes(key)||JSON.stringify(state.leases??{}).includes(`"${key}"`))throw Error('import coordinate is reserved for executed work; imports are evidence-only');
}
function inventory(base){
  const files=[];
  const walk=relative=>{const dir=within(base,relative);for(const name of readdirSync(dir).sort()){const rel=relative+'/'+name,full=within(base,rel),stat=lstatSync(full);if(stat.isDirectory())walk(rel);else if(stat.isFile())files.push({path:rel,sha256:hash(readFileSync(full))});else throw Error('import only accepts regular files');}};
  walk('request');walk('response');
  if(files.length>512)throw Error('producer bundle exceeds the bounded import inventory');
  return files.sort((a,b)=>a.path.localeCompare(b.path));
}
function metadata(source,manifest){
  const request=json(within(source,'request/request.json')),response=json(within(source,'response/response.json'));
  if(request.sessionId!==manifest.sourceSessionId||request.step!==manifest.sourceStep||request.parallel!==manifest.sourceParallel||response.step!==manifest.sourceStep||response.parallel!==manifest.sourceParallel||request.operatorId!==response.operatorId||response.status!=='done')throw Error('origin is not the named completed producer');
  return {request,response};
}
async function originAuthority(root,r,m){
  if(existsSync(path.join(r.source,'import.json')))throw Error('an imported slot cannot be laundered into a new producer');
  const original=metadata(r.source,m),state=json(within(r.sourceSession,'state.json')),key=`${m.sourceStep}/${m.sourceParallel}`;
  if(state.id!==m.sourceSessionId||state.steps?.[key]!==original.request.operatorId||state.requestHashes?.[key]!==hash(readFileSync(within(r.source,'request/request.json'))))throw Error('origin request does not match its original session operator and frozen request hash');
  try{for(const refs of Object.values(original.response.fields??{}))for(const ref of Array.isArray(refs)?refs:[refs])if(!lstatSync(within(r.source,ref)).isFile())throw Error('not a file');}catch{throw Error('origin output is missing or unsafe');}
  const {validateResponse}=await import('./validate-response.mjs');
  const result=await validateResponse(root,r.source,{requirements:original.request.requirements??{}});
  if(result.errors.length)throw Error('origin response fails its typed output gate: '+result.errors.slice(0,2).join('; '));
  return original;
}
function manifestShape(m){
  const keys=['schemaVersion','sourceSessionId','sourceStep','sourceParallel','targetSessionId','targetStep','targetParallel','files'];
  if(!m||typeof m!=='object'||Object.keys(m).sort().join()!==keys.sort().join()||m.schemaVersion!==1||!Array.isArray(m.files)||!m.files.length||m.files.length>512)throw Error('invalid import manifest shape');
  const seen=new Set();for(const f of m.files){if(!f||Object.keys(f).sort().join()!=='path,sha256'||!safeRelative(f.path)||!/^(request|response)\//.test(f.path)||!/^sha256:[a-f0-9]{64}$/.test(f.sha256)||seen.has(f.path))throw Error('invalid import file inventory');seen.add(f.path);}
}

export async function validateImportedInput(root,session,inputRef,kind,{hostRoot=path.dirname(root),receivingSessionId=path.basename(session)}={}){
  const match=/^step-([1-9]\d*)\/parallel-([1-9]\d*)\/(?:[a-z][a-z-]*\/)?response\//.exec(inputRef);
  // Existing local inputs keep their existing contract; this gate only owns explicit foreign imports.
  if(!match)return [];
  const branch=path.join(session,`step-${match[1]}`,`parallel-${match[2]}`),manifestFile=path.join(branch,'import.json');
  let producer;try{producer=json(path.join(branch,'request/request.json'));}catch{return existsSync(manifestFile)?['import producer request is missing']:[];}
  if(!existsSync(manifestFile)&&(!producer.sessionId||producer.sessionId===receivingSessionId))return [];
  try{
    if(!existsSync(manifestFile))throw Error('foreign producer requires an explicit import manifest');
    const m=json(manifestFile);manifestShape(m);
    if(m.targetSessionId!==receivingSessionId||m.targetSessionId!==path.basename(session)||m.targetStep!==Number(match[1])||m.targetParallel!==Number(match[2]))throw Error('import target does not match the receiving input coordinate');
    const r=roots(hostRoot,m.sourceSessionId,m.targetSessionId,m.sourceStep,m.sourceParallel,m.targetStep,m.targetParallel);
    if(path.resolve(r.target)!==path.resolve(branch))throw Error('import target is outside the Source session root');
    within(r.targetSession,`step-${m.targetStep}/parallel-${m.targetParallel}/import.json`);
    evidenceOnly(r.targetSession,m.targetStep,m.targetParallel);
    const origin=await originAuthority(root,r,m);metadata(r.target,m);
    const original=inventory(r.source),copied=inventory(r.target),normalize=v=>JSON.stringify([...v].sort((a,b)=>a.path.localeCompare(b.path)));
    if(normalize(original)!==normalize(m.files)||normalize(copied)!==normalize(m.files))throw Error('import bytes or origin inventory changed');
    const relative=path.relative(r.target,within(session,inputRef)).split(path.sep).join('/');
    const fields=origin.response.fields?.[kind],refs=Array.isArray(fields)?fields:[fields];
    if(!refs.includes(relative))throw Error('referenced import was not an output emitted by its original producer');
    const packages=await loadOperatorPackages(root),pkg=packages.find(p=>p.manifest.id===origin.request.operatorId);
    if(!pkg?.en.tables.outputs?.rows.some(row=>kindOf(row.kind)===kind))throw Error('import kind is not an output the original operator declares');
    return [];
  }catch(error){return [`request.json: import ${kind}: ${error.message}`];}
}

export async function importProducer({sourceSessionId,sourceStep,sourceParallel,targetSessionId,targetStep,targetParallel,root=ROOT,hostRoot=path.dirname(root)}){
  const m={schemaVersion:1,sourceSessionId,sourceStep,sourceParallel,targetSessionId,targetStep,targetParallel,files:[]};
  const r=roots(hostRoot,sourceSessionId,targetSessionId,sourceStep,sourceParallel,targetStep,targetParallel);
  if(existsSync(r.target))throw Error('import target already exists; never overwrite evidence');
  evidenceOnly(r.targetSession,targetStep,targetParallel);await originAuthority(root,r,m);m.files=inventory(r.source);manifestShape(m);
  const bytes=m.files.map(f=>[f.path,readFileSync(within(r.source,f.path))]);
  if(bytes.some(([p,b])=>hash(b)!==m.files.find(f=>f.path===p).sha256))throw Error('origin changed during import');
  mkdirSync(r.target,{recursive:true});
  for(const [p,b]of bytes){const dest=within(r.target,p,{missing:true});mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,b,{flag:'wx'});}
  writeFileSync(path.join(r.target,'import.json'),JSON.stringify(m,null,2)+'\n',{flag:'wx'});
  return {target:r.target,files:m.files.length,sourceSessionId};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const failed=error=>{process.stderr.write(error.message+'\n');process.exitCode=1;};
  try{if(process.argv.length!==8)throw Error('usage: node producer-import.mjs <source-session> <source-step> <source-parallel> <target-session> <target-step> <target-parallel>');const [sourceSessionId,s,p,targetSessionId,t,q]=process.argv.slice(2);importProducer({sourceSessionId,sourceStep:Number(s),sourceParallel:Number(p),targetSessionId,targetStep:Number(t),targetParallel:Number(q)}).then(result=>process.stdout.write(JSON.stringify(result)+'\n'),failed);}catch(error){failed(error);}
}
```

## FILE: .claude/scripts/audit-scope.mjs

SHA-256: f6aaa09f45d1b9229ec487eea8099b063f394274fb906983623f274b8ec6a0be

```javascript
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainst } from './json-schema.mjs';
import { sessionRootOf, validateRequest } from './validate-request.mjs';
import { tableUnder } from './validate-response.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = (file) => JSON.parse(readFileSync(file, 'utf8'));
export function upstreamAuditScope(branch, request, root = ROOT) {
  const ref = request?.inputs?.['frontend-surface-audit'];
  if (!ref) return null;
  if (!/^(?:step-\d+\/parallel-\d+\/)+response\/response\.md$/.test(ref)) throw new Error('audit admission must be a session receipt reference');
  const receipt = path.join(sessionRootOf(branch), ref);
  const verdictFile = path.join(path.dirname(receipt), 'data/verdicts.json');
  const scope = existsSync(verdictFile) ? json(verdictFile).auditScope : null;
  if (!scope) {
    if (existsSync(receipt) && readFileSync(receipt, 'utf8').includes('## Audit scope')) throw new Error('scoped audit admission is missing its typed scope');
    return null;
  }
  const errors = validateAgainst(json(path.join(root, 'templates/kinds/audit-scope.schema.json')), scope, 'auditScope');
  if (errors.length) throw new Error(errors.join('\n'));
  return scope;
}
export function auditScopeCarryErrors(branch, request, response, root = ROOT) {
  try {
    const scope = upstreamAuditScope(branch, request, root);
    const errors = [];
    const ref = response.fields?.['audit-scope'];
    if (scope) {
      if (ref !== 'response/data/audit-scope.json' || !existsSync(path.join(branch, ref))) return ['scoped audit admission must carry response/data/audit-scope.json'];
      if (JSON.stringify(json(path.join(branch, ref))) !== JSON.stringify(scope)) errors.push('audit scope and deferred states must be carried unchanged');
    } else if (ref && ref !== '—') errors.push('audit scope output requires a scoped audit admission');
    const receipt = path.join(branch, 'response/response.md');
    if (existsSync(receipt)) {
      const rows = Object.fromEntries(tableUnder(readFileSync(receipt, 'utf8'), '## Audit scope') ?? []);
      const expected = scope
        ? { Mode: scope.mode, 'Coverage claim': scope.coverageClaim, 'Deferred states': scope.deferredStates.join(', ') || '—' }
        : { Mode: 'not-recorded', 'Coverage claim': 'not-recorded', 'Deferred states': '—' };
      for (const [field, value] of Object.entries(expected)) if (rows[field] !== value) errors.push(`receipt Audit scope ${field} must preserve ${value}`);
    }
    return errors;
  } catch (error) { return [error.message]; }
}
export async function carryAuditScope(branch, root = ROOT) {
  const result = await validateRequest(root, branch);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  if (!['quality.verify', 'uat.verify'].includes(result.request.operatorId)) throw new Error('scope carry belongs to quality or UAT');
  const scope = upstreamAuditScope(branch, result.request, root);
  if (!scope) return null;
  const destination = path.join(branch, 'response/data/audit-scope.json');
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify(scope, null, 2) + '\n');
  return scope;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await carryAuditScope(path.resolve(process.argv[2])); process.stdout.write('audit scope carried\n'); }
  catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}
```

## FILE: .claude/scripts/workspace-checkout.mjs

SHA-256: bfd1c6985160171dce74eeb393fa5b74b2795a771fd18d188b96ad0ca18fe0e8

```javascript
#!/usr/bin/env node
// workspace.bind's read-only selection of a declared checkout or its own registered session worktree.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { validateLocalRoute, validatePortableRoute } from './workspace-portable.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isSessionId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
const slash = value => value.replaceAll('\\', '/');
const comparable = value => process.platform === 'win32' ? slash(value).toLowerCase() : slash(value);
const samePath = (left, right) => comparable(path.resolve(left)) === comparable(path.resolve(right));
const within = (root, target) => { const rel = path.relative(root, target); return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${path.sep}`)); };
const sha256 = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const fail = (code, message) => { const error = new Error(`${code}: ${message}`); error.code = code; throw error; };
const requireThat = (truth, code, message) => { if (!truth) fail(code, message); };
const real = (value, code = 'ROUTE_MISMATCH') => { try { return realpathSync(value); } catch { fail(code, 'a declared or registered checkout path is absent'); } };
function git(cwd, ...args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  try { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' } }); }
  catch { fail('ROUTE_MISMATCH', 'read-only Git identity verification failed'); }
}
const gitValue = (cwd, ...args) => git(cwd, ...args).trim();
const commonDir = checkout => real(gitValue(checkout, 'rev-parse', '--path-format=absolute', '--git-common-dir'));
function remoteIdentity(value) {
  const match = /^(?:https:\/\/github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(value.trim());
  return match?.[1].toLowerCase() ?? null;
}
function routeFile(source, relative, code) {
  const file = path.join(source, relative);
  requireThat(existsSync(file), code, 'route declaration is absent');
  requireThat(within(source, real(file)), 'ROUTE_MISMATCH', 'route declaration escapes Source');
  const bytes = readFileSync(file);
  try { return { bytes, value: JSON.parse(bytes) }; } catch { fail('ROUTE_MISMATCH', 'route declaration is not JSON'); }
}
function rootsFor(checkout, roots) {
  requireThat(Array.isArray(roots), 'INVALID_INPUT', 'declaredWriteRoots must be a list');
  return roots.map(root => {
    requireThat(typeof root === 'string' && root.length > 0 && !path.isAbsolute(root) && !/^[A-Za-z]:/.test(root) && !root.includes('\\') && !root.split('/').some(part => !part || part === '.' || part === '..'), 'INVALID_INPUT', 'write roots must be safe repository-relative paths');
    const target = path.resolve(checkout, root);
    requireThat(within(checkout, target), 'INVALID_INPUT', 'write root escapes the checkout');
    return { root, target };
  });
}
function assertTree(checkout, roots, allowDirty) {
  const parsedRoots = rootsFor(checkout, roots);
  // NUL porcelain avoids quoted filenames; a rename has both destination and source paths.
  const records = git(checkout, 'status', '--porcelain=v1', '-z', '--untracked-files=all').split('\0');
  const dirty = [];
  for (let index = 0; index < records.length; index += 1) {
    if (!records[index]) continue;
    const record = records[index];
    dirty.push(record.slice(3));
    if (/[RC]/.test(record.slice(0, 2))) dirty.push(records[++index]);
  }
  requireThat(allowDirty || dirty.length === 0, 'CHECKOUT_DIRTY', 'the canonical mutation checkout must be clean');
  for (const dirtyPath of dirty) {
    requireThat(typeof dirtyPath === 'string' && dirtyPath.length > 0, 'CHECKOUT_DIRTY', 'Git returned an incomplete changed path');
    const target = path.resolve(checkout, dirtyPath);
    requireThat(within(checkout, target) && parsedRoots.some(root => within(root.target, target)), 'CHECKOUT_DIRTY', 'a changed path is outside the declared write roots');
    let cursor = target;
    while (within(checkout, cursor) && !samePath(cursor, checkout)) {
      let stat;
      try { stat = lstatSync(cursor); } catch (error) { requireThat(error.code === 'ENOENT', 'CHECKOUT_DIRTY', 'a changed path cannot be inspected'); }
      if (stat) requireThat(!stat.isSymbolicLink() && within(checkout, real(cursor)), 'CHECKOUT_DIRTY', 'a changed path traverses a symbolic link');
      cursor = path.dirname(cursor);
    }
  }
}
function worktrees(canonical) {
  const rows = [];
  let current = {};
  for (const entry of git(canonical, 'worktree', 'list', '--porcelain', '-z').split('\0')) {
    if (!entry) { if (current.worktree) rows.push(current); current = {}; continue; }
    const space = entry.indexOf(' ');
    current[space < 0 ? entry : entry.slice(0, space)] = space < 0 ? true : entry.slice(space + 1);
  }
  if (current.worktree) rows.push(current);
  return rows;
}

export function resolveWorkspaceCheckout({ source = path.dirname(ROOT), project, role, sessionId, checkout = 'routed', declaredWriteRoots = [] }) {
  requireThat(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project ?? '') && /^(fe|be)$/.test(role ?? ''), 'INVALID_INPUT', 'project and role must be declared route identifiers');
  requireThat(['routed', 'session'].includes(checkout), 'INVALID_INPUT', 'checkout must be routed or session');
  requireThat(isSessionId(sessionId), 'INVALID_INPUT', 'sessionId must identify one session');
  source = real(source);
  const portableRouteRef = `.workspaces/projects/${project}/${role}.json`;
  const hydratedRouteRef = `.workspaces/local/routes/${project}/${role}/config.json`;
  const portable = routeFile(source, portableRouteRef, 'ROUTE_UNDECLARED');
  const hydrated = routeFile(source, hydratedRouteRef, 'ROUTE_UNHYDRATED');
  try { validatePortableRoute(portable.value); validateLocalRoute(hydrated.value); }
  catch { fail('ROUTE_MISMATCH', 'portable or hydrated route fails its schema'); }
  const declaration = portable.value, local = hydrated.value, repo = declaration.repository;
  requireThat(declaration.project === project && local.project === project && declaration.role === role && local.role === role, 'ROUTE_MISMATCH', 'route identity differs from its declaration location');
  requireThat(samePath(real(local.source.path), source) && samePath(real(local.source.workspaceRoot), path.join(source, '.workspaces')) && samePath(real(local.source.trust), path.join(source, '.claude')) && samePath(local.source.skills, path.join(source, '.claude', 'skills')), 'ROUTE_MISMATCH', 'hydrated route belongs to another Source');
  requireThat(repo.gitPolicy && local.repository.gitPolicy, 'INVALID_INPUT', 'both route halves must declare gitPolicy');
  requireThat(isDeepStrictEqual(repo.gitPolicy, local.repository.gitPolicy), 'ROUTE_MISMATCH', 'route halves disagree on Git policy');
  requireThat(remoteIdentity(repo.gitRepository) && remoteIdentity(repo.gitRepository) === remoteIdentity(local.repository.gitRepository) && repo.branch === local.repository.branch, 'ROUTE_MISMATCH', 'route halves disagree on repository or branch');
  const canonical = real(repo.kind === 'source' ? source : path.resolve(source, '..', repo.directory));
  requireThat(repo.kind === 'source' || (within(real(path.dirname(source)), canonical) && !samePath(canonical, real(path.dirname(source)))), 'ROUTE_MISMATCH', 'sibling checkout escapes the repositories root');
  requireThat(samePath(real(local.repository.diskPath), canonical) && samePath(real(local.repository.gitRoot), canonical) && samePath(real(gitValue(canonical, 'rev-parse', '--show-toplevel')), canonical), 'ROUTE_MISMATCH', 'hydrated route does not identify the declared Git root');
  requireThat(remoteIdentity(gitValue(canonical, 'remote', 'get-url', 'origin')) === remoteIdentity(repo.gitRepository), 'ROUTE_MISMATCH', 'canonical origin differs from the declaration');
  requireThat(gitValue(canonical, 'branch', '--show-current') === repo.branch, 'BRANCH_POLICY_VIOLATION', 'canonical checkout is not on the declared mutation branch');
  const canonicalHead = gitValue(canonical, 'rev-parse', 'HEAD');
  const canonicalCommon = commonDir(canonical);
  let selected = canonical, head = canonicalHead, branch = repo.branch, sessionCheckout;
  if (checkout === 'session') {
    requireThat(repo.gitPolicy.worktreeBranches === 'session-only', 'BRANCH_POLICY_VIOLATION', 'a forbidden worktree policy cannot select a session checkout');
    branch = `session/${sessionId}`;
    const candidates = worktrees(canonical).filter(item => item.branch === `refs/heads/${branch}`);
    requireThat(candidates.length === 1, 'ROUTE_MISMATCH', 'the current session must have exactly one registered worktree');
    const registration = candidates[0];
    requireThat(!registration.bare && !registration.detached && !registration.prunable && !registration.locked, 'ROUTE_MISMATCH', 'the session worktree registration is not available');
    selected = real(registration.worktree);
    requireThat(!samePath(selected, canonical) && samePath(real(gitValue(selected, 'rev-parse', '--show-toplevel')), selected) && samePath(commonDir(selected), canonicalCommon), 'ROUTE_MISMATCH', 'session checkout is not a registered worktree of the canonical repository');
    requireThat(gitValue(selected, 'branch', '--show-current') === branch && remoteIdentity(gitValue(selected, 'remote', 'get-url', 'origin')) === remoteIdentity(repo.gitRepository), 'ROUTE_MISMATCH', 'session checkout branch or repository identity differs');
    head = gitValue(selected, 'rev-parse', 'HEAD');
    requireThat(registration.HEAD === head, 'SOURCE_DRIFT', 'registered session head moved during selection');
    assertTree(canonical, [], false);
    sessionCheckout = { sessionId, canonicalDiskPath: slash(canonical), canonicalSourceHead: canonicalHead, canonicalBranch: repo.branch, gitCommonDir: slash(canonicalCommon) };
  }
  assertTree(selected, declaredWriteRoots, checkout === 'session');
  const gitPolicy = { worktreeBranches: repo.gitPolicy.worktreeBranches, mutationBranch: repo.gitPolicy.mutationBranch };
  return { project, role, portableRouteRef, hydratedRouteRef, routeFingerprint: sha256(Buffer.concat([portable.bytes, hydrated.bytes])), sourceHead: head,
    checkout: { diskPath: slash(selected), gitRoot: slash(selected), gitRepository: repo.gitRepository, branch, repositoryKind: repo.kind, directory: repo.directory ?? null, sourceHead: head },
    gitPolicy, writeRoots: declaredWriteRoots, mutationReadiness: declaredWriteRoots.length ? 'ready' : 'read-only', ...(sessionCheckout ? { sessionCheckout } : {}) };
}

function sessionIdentityErrors(root, request, branchDir) {
  try {
    requireThat(isSessionId(request?.sessionId) && Number.isSafeInteger(request?.step) && request.step > 0 && Number.isSafeInteger(request?.parallel) && request.parallel > 0, 'INVALID_INPUT', 'session identity and coordinates must be safe before resolving paths');
    requireThat(typeof branchDir === 'string', 'INVALID_INPUT', 'session checkout requires its containing request branch');
    const expected = path.resolve(path.dirname(root), '.worktrees', 'sessions', request.sessionId, `step-${request.step}`, `parallel-${request.parallel}`);
    requireThat(samePath(path.resolve(branchDir), expected) && samePath(real(branchDir), expected), 'INVALID_INPUT', 'session checkout request is outside its own session coordinate');
    const state = JSON.parse(readFileSync(path.join(branchDir, '..', '..', 'state.json'), 'utf8'));
    const bytes = readFileSync(path.join(branchDir, 'request', 'request.json'));
    const coordinate = `${request.step}/${request.parallel}`;
    requireThat(state.id === request.sessionId && state.steps?.[coordinate] === 'workspace.bind', 'INVALID_INPUT', 'containing session does not own this workspace.bind coordinate');
    requireThat(isDeepStrictEqual(JSON.parse(bytes), request) && state.requestHashes?.[coordinate] === sha256(bytes), 'INVALID_INPUT', 'session checkout requires the unchanged frozen request hash');
    return [];
  } catch (error) { return [`request.json: ${error.code ? error.message : 'INVALID_INPUT: session identity or frozen request cannot be verified'}`]; }
}

export function validateWorkspaceCheckoutRequest(root, request, branchDir) {
  const requirements = request.requirements ?? {};
  if (requirements.checkout === undefined) return [];
  if (!['routed', 'session'].includes(requirements.checkout)) return ['request.json: checkout must be routed or session'];
  if (requirements.checkout !== 'session') return [];
  const identityErrors = sessionIdentityErrors(root, request, branchDir);
  if (identityErrors.length) return identityErrors;
  try {
    const result = resolveWorkspaceCheckout({ source: path.dirname(root), project: requirements.project, role: requirements.role, sessionId: request.sessionId, checkout: 'session', declaredWriteRoots: requirements.declaredWriteRoots ?? [] });
    if (requirements.gitPolicy && (requirements.gitPolicy.worktreeBranches !== result.gitPolicy.worktreeBranches || requirements.gitPolicy.mutationBranch !== result.gitPolicy.mutationBranch)) return ['request.json: requested Git policy differs from the declared route'];
    return [];
  } catch (error) { return [`request.json: ${error.message}`]; }
}

export function validateWorkspaceCheckoutBinding(root, request, route, branchDir) {
  const mode = request?.requirements?.checkout ?? 'routed';
  if (mode !== 'session') return route.sessionCheckout !== undefined ? ['response/data/route.json: sessionCheckout requires checkout=session'] : [];
  if (!route.sessionCheckout) return ['response/data/route.json: checkout=session requires a sessionCheckout binding'];
  const identityErrors = sessionIdentityErrors(root, request, branchDir);
  if (identityErrors.length) return identityErrors;
  try {
    const observed = resolveWorkspaceCheckout({ source: path.dirname(root), project: request.requirements.project, role: request.requirements.role, sessionId: request.sessionId, checkout: mode, declaredWriteRoots: request.requirements.declaredWriteRoots ?? [] });
    const errors = [];
    for (const key of Object.keys(observed)) if (!isDeepStrictEqual(route[key], observed[key])) errors.push(`response/data/route.json: ${key} differs from independently observed workspace selection`);
    return errors;
  } catch (error) { return [`response/data/route.json: ${error.message}`]; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [project, role, sessionId, checkout = 'routed', ...declaredWriteRoots] = process.argv.slice(2);
  try { process.stdout.write(`${JSON.stringify(resolveWorkspaceCheckout({ project, role, sessionId, checkout, declaredWriteRoots }), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
```

## FILE: .claude/readiness/initialization/stacks/environment.schema.json

SHA-256: 0d75d2daa8d33b6c5c5e351981524807b3c1ce95d574cce183699a66a80adf5d

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://starci.dev/v9/readiness/initialization/stacks/environment.schema.json",
  "title": "Environment declaration",
  "description": "`<Source>/.stacks/<env>/environment.json`: what one environment of the installation declares about itself. The folder's presence is what names the environment — an `env` requirement is checked against the folder, never against a list. This file declares who authorises each operation class and which nonsecret migration targets the environment owns. Authority for a platform operation comes from the environment's declaration, not from a per-run approval, whenever the declaration marks that operation's class `declared`; a class marked `person` needs an approval id. A request's `approval` therefore accepts either an approval id or a reference to this file — its path and the hash of its bytes, in the shape `$defs.reference` gives — and the reference is an approval only for a class this declaration marks `declared`, in this environment. A class the declaration omits takes the default `$defs.defaults` gives for its `production` value: a non-production environment authorises identity provisioning, seeding, the shared runtime's rungs and the stack's bring-up by declaration and keeps release with a person; a production environment keeps every class with a person. Any declaration may tighten a class to `person`; a production declaration may not loosen `release`, and this schema refuses one that tries. Silence remains silence: a request with no `approval` is not one whose environment answered.",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "env", "production"],
  "properties": {
    "$schema": { "type": "string", "minLength": 1 },
    "schemaVersion": { "const": 9 },
    "env": {
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      "description": "The environment this file declares; it is the folder the file lives in, and the two must agree."
    },
    "production": {
      "type": "boolean",
      "description": "Whether people are served from this environment. It selects which column of `$defs.defaults` an omitted class takes, and it is what forbids loosening `release`."
    },
    "migrationTargets": {
      "type": "array",
      "uniqueItems": true,
      "description": "Nonsecret connection identities this environment owns for migration releases. A release plan pins these declaration bytes and matches one complete entry; its own env, target or credential reference cannot declare ownership. Entries are maintained by the environment owner before release preparation, never created or loosened by the migration executor. Their presence does not change release authorization.",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["project", "target", "connectionRef", "connection"],
        "properties": {
          "project": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          "target": { "type": "string", "minLength": 1 },
          "connectionRef": { "type": "string", "pattern": "^secret-ref://[A-Za-z0-9][A-Za-z0-9_./-]*$" },
          "connectionFingerprint": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$", "description": "The environment owner's canonical full connection commitment, prepared privately using the runner protocol. Required when username is sealed: the full hash includes the resolved username, while the declaration carries only its custody reference. The migration executor never creates or replaces this commitment." },
          "connection": { "$ref": "#/$defs/migrationConnection" }
        },
        "if": { "properties": { "connection": { "required": ["usernameRef"] } } },
        "then": { "required": ["connectionFingerprint"] }
      }
    },
    "authorization": {
      "type": "object",
      "additionalProperties": false,
      "description": "Per operation class, who authorises it in this environment. A class absent here takes its default; a class present here may tighten the default to `person`, and a non-production declaration may loosen one to `declared`.",
      "properties": {
        "identity-provisioning": {
          "$ref": "#/$defs/authority",
          "description": "Creating a flow's account at the environment's identity provider and writing its record of names."
        },
        "seed": {
          "$ref": "#/$defs/authority",
          "description": "Applying a flow's scoped fixtures to the environment's data."
        },
        "runtime": {
          "$ref": "#/$defs/authority",
          "description": "The shared runtime's server rungs and its registry: locating, starting, serving, restarting, resetting and stopping the one server of a route, and attesting its entry."
        },
        "stack-up": {
          "$ref": "#/$defs/authority",
          "description": "Bringing up the environment's declared infrastructure."
        },
        "release": {
          "$ref": "#/$defs/authority",
          "description": "Deploying a release to this environment. Never `declared` where `production` is true."
        }
      }
    }
  },
  "if": {
    "required": ["production"],
    "properties": { "production": { "const": true } }
  },
  "then": {
    "properties": {
      "authorization": {
        "properties": {
          "release": { "const": "person" }
        }
      }
    }
  },
  "$defs": {
    "migrationConnection": {
      "type": "object",
      "additionalProperties": false,
      "required": ["driver", "host", "port", "database", "schema"],
      "allOf": [{ "oneOf": [{ "required": ["username"] }, { "required": ["usernameRef"] }] }],
      "description": "The effective database identity with its username either explicitly nonsecret or represented only by sealed custody. Strings are exact, without hostname alias folding; the effective schema is explicit. A sealed username stays private and enters only the full connection commitment during preparation and connection verification. The runner resolves its actual configuration, verifies database, schema and username against the connected server before effects, and fingerprints the full identity using the runner protocol. Credential values, connection URLs and userinfo are forbidden.",
      "properties": {
        "driver": { "type": "string", "pattern": "^[a-z][a-z0-9-]*$" },
        "host": { "type": "string", "pattern": "^[A-Za-z0-9_:.-]+$", "maxLength": 255 },
        "port": { "type": "integer", "minimum": 1, "maximum": 65535 },
        "database": { "type": "string", "minLength": 1, "pattern": "^[^\\u0000-\\u001f\\u007f]+$" },
        "schema": { "type": "string", "minLength": 1, "pattern": "^[^\\u0000-\\u001f\\u007f]+$" },
        "username": { "type": "string", "minLength": 1, "pattern": "^[^\\u0000-\\u001f\\u007f]+$" },
        "usernameRef": { "type": "string", "pattern": "^secret-ref://[A-Za-z0-9][A-Za-z0-9_./-]*$" }
      }
    },
    "authority": {
      "enum": ["declared", "person"],
      "description": "`declared`: this declaration is the approval, and a request names it by `$defs.reference`. `person`: an approval id is required, and a declaration reference is refused for the class."
    },
    "defaults": {
      "description": "What a class the declaration omits is read as, by `production`. These two rows are the only place the defaults live; a validator reads them from here.",
      "production": {
        "identity-provisioning": "person",
        "seed": "person",
        "runtime": "person",
        "stack-up": "person",
        "release": "person"
      },
      "non-production": {
        "identity-provisioning": "declared",
        "seed": "declared",
        "runtime": "declared",
        "stack-up": "declared",
        "release": "person"
      }
    },
    "reference": {
      "type": "string",
      "pattern": "^\\.stacks/([a-z0-9]+(?:-[a-z0-9]+)*)/environment\\.json#(sha256:[0-9a-f]{64})$",
      "description": "How a request's `approval` names this declaration: the file's path from the host repository root, `#`, and the sha256 of its bytes. The hash is what binds the approval to one exact declaration; a declaration edited after the request was written no longer matches it, which is authority drift and not a quieter approval."
    }
  }
}
```

