import fs from 'node:fs';
import path from 'node:path';
const root='D:/Repositories/starci-academy-backend/.worktrees/v25-workflow-reentry/.claude';
const file=path.join(root,'package.json');
const pkg=JSON.parse(fs.readFileSync(file,'utf8'));pkg.version='2.5.0-rc.7';fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
for(const [name,line] of [
 ['INDEX.md','2.5.0-rc.7 (2026-09-06): workflow retries retain sealed historical bindings while checking current write authority on fresh invocations; corrected technical inputs re-enter through explicit progress and preserved failure evidence.'],
 ['INDEX.vi.md','2.5.0-rc.7 (2026-09-06): retry workflow giữ nguyên binding lịch sử đã niêm phong và kiểm tra quyền ghi hiện tại khi mở lần chạy mới; đầu vào kỹ thuật được sửa phải có tiến triển rõ ràng và giữ nguyên bằng chứng thất bại.']
]) {
 const p=path.join(root,name);let s=fs.readFileSync(p,'utf8');s=s.replace('2.5.0-rc.6','2.5.0-rc.7');
 const marker=s.indexOf('2.5.0-rc.6 (2026-09-06):');if(marker<0)throw Error('lineage marker missing '+name);
 s=s.slice(0,marker)+line+'\n\n'+s.slice(marker);fs.writeFileSync(p,s);
}
console.log('Candidate release metadata prepared; unpublished and unverified.');
