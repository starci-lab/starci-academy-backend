import fs from 'node:fs'
const m=JSON.parse(fs.readFileSync(new URL('./records.json',import.meta.url),'utf8'))
const rows=m.records
const make=()=>({status:'prepared-query-bundle',namespace:m.namespace,inserts:rows.map(r=>{const k=Object.keys(r.columns);return {table:r.table,sql:'INSERT INTO "'+r.table+'" ('+k.map(x=>'"'+x+'"').join(',')+') VALUES ('+k.map((_,i)=>'$'+(i+1)).join(',')+');',params:k.map(x=>r.columns[x])}}),deletes:rows.slice().reverse().map(r=>({table:r.table,sql:'DELETE FROM "'+r.table+'" WHERE "id"=$1 AND "namespace"=$2 AND "is_uat"=TRUE;',params:[r.columns.id,m.namespace]}))})
if(process.argv.includes('--render-sql')) console.log(JSON.stringify(make(),null,2)); else {console.error('refused-before-mutation: prepared bundle only');process.exitCode=2}

