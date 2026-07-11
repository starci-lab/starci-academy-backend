export const meta = {
  name: 'normalize-3step',
  description: 'Chuẩn hóa run-block trong body sang FORMAT 3-STEP (Step1 vào/cd, Step2 cài, Step3 chạy) cho 4 lang, vi/en mirror, re-gate. args.modules = [slug...]',
  phases: [{ title: 'Normalize', detail: '3-step relabel per module', model: 'sonnet' }],
}
function asObj(a){ if(!a) return {}; if(typeof a==='object') return a; if(typeof a==='string'){const s=a.trim(); if(s.startsWith('{')){try{return JSON.parse(s)}catch(e){}} if(s.startsWith('[')){try{return {modules:JSON.parse(s)}}catch(e){}}} return {} }
const ARGS = asObj(args)
const MODULES = ARGS.modules || []
if (!MODULES.length) throw new Error('args.modules required, vd {modules:["0-nestjs-core-and-request-lifecycle"]}')
const ROOT = 'C:/Repositories/ac/starci-academy-backend'

phase('Normalize')
const res = await parallel(MODULES.map(function (M) {
  return function () {
    const MODDIR = '.mount/data/courses/0-fullstack-mastery/modules/' + M
    return agent(
      'CHUẨN HÓA 3-STEP run-block trong body module ' + M + '. cwd=' + ROOT + '. ĐỌC rule .claude/docs/rules/fullstack/coding.md §A2 (format 3-step).\n' +
      'ĐỌC KĨ từng run-block (đừng máy móc) — SỬA LOGIC cho có nghĩa:\n' +
      '  • BỎ `cd` TRÙNG LẶP (vd hai dòng `cd backend/<lang>` liên tiếp; câu "quay lại thư mục" trong khi đã ở đó = SAI, xóa).\n' +
      '  • DOCKER infra: `docker compose up -d`/`down` PHẢI chạy ở nơi có `.docker/compose.yaml` (cấp LESSON, KHÔNG phải backend/<lang>). Dùng `docker compose -f .docker/compose.yaml up -d` chạy TỪ thư mục lesson (KHÔNG cd vào backend rồi mới docker). Kiểm tra vị trí compose.yaml thật trong repo.\n' +
      '  • Thứ tự đúng cho lesson CÓ docker: (B1) dựng infra `docker compose -f .docker/compose.yaml up -d` → (B2) `cd backend/<lang>` + cài → (B3) chạy. Lesson KHÔNG docker: (B1) `cd backend/<lang>` → (B2) cài → (B3) chạy.\n' +
      'Với MỌI bodies/<lang>/{vi,en}.md (4 lang) mọi lesson trong ' + MODDIR + '/contents: chuẩn hóa run-block về step rõ nghĩa, thứ tự (infra)→vào→cài→chạy, KHÔNG cd thừa:\n' +
      '  # Step 1: ...\\n  <cmd>\\n\\n  # Step 2: ...\\n  <cmd>\\n\\n  # Step 3: ...\\n  <cmd>\n' +
      '(vi.md dùng tiếng Việt có dấu: "Bước 1: Vào thư mục", "Bước 2: Cài dependency", "Bước 3: Chạy"; en.md dùng "Step 1: Enter directory", "Step 2: Install dependencies", "Step 3: Run". Install/run cmd ĐÚNG theo lang: TS npm install / nest start --watch; Java mvn install -DskipTests / mvn spring-boot:run; C# dotnet restore / dotnet watch run; Go go mod download / go run .)\n' +
      'GIỮ block clone riêng (cd <repo>/<lesson>). KHÔNG đổi nội dung khác. vi/en mirror (giữ fence/heading parity).\n' +
      'Sau đó: `bash .claude/docs/check-cd-first.sh ' + MODDIR + '` = 0 + re-gate `powershell -NoProfile -File .claude/docs/check-lesson.ps1 -Path "' + MODDIR + '"` = 0 fail. Còn sai → sửa.\n' +
      'TRẢ VỀ: số block chuẩn hóa, cd-first, gate.',
      { label: 'norm:' + M, phase: 'Normalize', model: 'sonnet' }
    )
  }
}))
return { modules: MODULES, results: res }
