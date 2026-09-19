import fs from 'node:fs'
const m=JSON.parse(fs.readFileSync(new URL('./records.json',import.meta.url),'utf8'))
const deletes=m.records.slice().reverse().map(r=>({table:r.table,sql:'DELETE FROM "'+r.table+'" WHERE "id"=$1 AND "namespace"=$2 AND "is_uat"=TRUE;',params:[r.columns.id,m.namespace]}))
if(process.argv.includes('--render-sql')) console.log(JSON.stringify({status:'prepared-rollback-query-bundle',namespace:m.namespace,deletes},null,2)); else {console.error('refused-before-mutation: no seed applied');process.exitCode=2}