import { spawnSync } from "node:child_process"
import fs from "node:fs"
const m=JSON.parse(fs.readFileSync(new URL("./records.json",import.meta.url),"utf8"))
const sql="select 'columns',table_name,column_name,is_nullable,column_default from information_schema.columns where table_name in ('catalog_orders','agent_workspaces','agentos_module_installations','agentos_module_chat_sessions','agentos_module_chat_messages','agentos_module_context_versions') union all select 'indexes',tablename,indexname,indexdef,'' from pg_indexes where tablename in ('agentos_module_chat_sessions','agentos_module_context_versions') union all select 'owner',id::text,email,'','' from users where id='1054fab9-ca3e-44c2-b2de-754fd458d6fb' union all select 'catalog',id::text,fulfillment_kind::text,name,'' from catalog_items where lower(name) like '%agent%' or lower(slug) like '%agent%'"
const startedAt=new Date().toISOString()
const r=spawnSync("docker",["exec","nivo-postgres","sh","-lc",'psql -U "$(cat /run/secrets/postgres-user)" -d nivo -At -F "|" -c "'+sql+'"'],{encoding:"utf8"})
const evidence={startedAt,finishedAt:new Date().toISOString(),exit:r.status,stdout:r.stdout,stderr:r.stderr}
const tables=["catalog_orders","agent_workspaces","agentos_module_installations","agentos_module_chat_sessions","agentos_module_chat_messages","agentos_module_context_versions"]
const missing=Object.fromEntries(tables.map(t=>[t,{namespace:(r.stdout||"").includes(t+"|namespace"),is_uat:(r.stdout||"").includes(t+"|is_uat")}]))
if(r.status!==0){console.error(JSON.stringify({status:"refused-before-mutation",reason:"database-read-only-query-failed",evidence}));process.exitCode=2}else{console.log(JSON.stringify({status:"read-only-query-complete",missing,evidence}))}

