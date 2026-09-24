const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const backendRoot = process.cwd();
const backendRequire = createRequire(path.join(backendRoot, "package.json"));
backendRequire("reflect-metadata");
backendRequire("ts-node/register/transpile-only");
backendRequire("tsconfig-paths/register");
const { Test } = backendRequire("@nestjs/testing");
const { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } = backendRequire("@nestjs/graphql");
const { parse, validate } = backendRequire("graphql");
const frontendRoot = process.argv[2];
if (!frontendRoot) throw new Error("frontend checkout path is required");

const { ChatbotResolver } = require(path.join(backendRoot, "apps/agentos-controlplane/src/chatbot/chatbot.resolver.ts"));
const source = fs.readFileSync(path.join(frontendRoot, "apps/app/src/modules/api/workspace-controlplane.ts"), "utf8");
const documents = [...source.matchAll(/`((?:query|mutation)\s+(?:Chatbot|BindChatbot|StartZalo|SetChatbot|ResolveChatbot|ReconcileChatbot)[\s\S]*?)`/gu)].map((match) => match[1]);
if (documents.length !== 6) throw new Error(`expected 6 Chatbot GraphQL documents, found ${documents.length}`);

(async () => {
  const testing = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
  const schema = await testing.get(GraphQLSchemaFactory).create([ChatbotResolver]);
  const errors = documents.flatMap((document) => validate(schema, parse(document)).map((error) => error.message));
  if (errors.length) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`validated ${documents.length} Chatbot GraphQL documents against the generated backend schema\n`);
  }
  await testing.close();
})().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
