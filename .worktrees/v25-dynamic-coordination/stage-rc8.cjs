const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'.claude'),packageFile=path.join(root,'package.json'),pkg=JSON.parse(fs.readFileSync(packageFile));
if(pkg.version!=='2.5.0-rc.7')throw Error('stage only on integrated RC.7');
pkg.version='2.5.0-rc.8';pkg.files.push('tests/evidence/20260906-dynamic-coordination.md');
fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n');
for(const [file,heading,line] of [
 ['INDEX.md','## Lineage','2.5.0-rc.8 (2026-09-06): dynamic shared-workflow extraction transfers one sealed writer, parks only dependent nodes, retains exact source incorporation and proves all original outcomes against one measured integrated runtime. See tests/evidence/20260906-dynamic-coordination.md.'],
 ['INDEX.vi.md','## Dòng dõi','2.5.0-rc.8 (2026-09-06): tách workflow chung giữa luồng chuyển đúng một quyền ghi đã niêm phong, chỉ chờ các bước phụ thuộc, giữ bằng chứng tích hợp source chính xác và chứng minh mọi kết quả gốc trên cùng runtime tích hợp đã đo. Xem tests/evidence/20260906-dynamic-coordination.md.']
]){
 let text=fs.readFileSync(path.join(root,file),'utf8');
 if(!text.startsWith('# StarCi Skills 2.5.0-rc.7'))throw Error('unexpected index version');
 text=text.replace('# StarCi Skills 2.5.0-rc.7','# StarCi Skills 2.5.0-rc.8');
 const marker=heading+'\n\n';if(!text.includes(marker))throw Error('missing lineage home');
 fs.writeFileSync(path.join(root,file),text.replace(marker,marker+line+'\n\n'));
}
console.log('Staged RC.8 candidate version and one lineage entry; publication remains root-owned.');
