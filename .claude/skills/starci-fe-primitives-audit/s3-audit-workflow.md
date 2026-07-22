# S3 — Audit fan-out (1 workflow, PORT-only)

1 workflow · `parallel` mỗi primitive 1 agent **Sonnet** chấm 10 chiều canon → schema gaps structured. Synth ở S4.

## Ràng cho MỖI agent (nhồi vào prompt)
- **PORT-ONLY:** đọc `.storybook/stories/blocks/**/<Name>/<Name>.tsx` (port) + `*.stories.tsx`. **NẾU port đã compose đúng mà `src` hand-roll → NỢ-SYNC, KHÔNG flag.** Fallback đọc `src` CHỈ khi không có port.
- **Bỏ check không áp dụng** (Logo/Media tĩnh → bỏ size/skeleton/icon). Chỉ liệt kê GAP thực.
- Neo `file:line`. severity: high (sai lõi: hand-roll thay compose, anatomy union, consumer set size, nên-là-prop mà tách component) · med (thiếu size/isSkeleton) · low (spacing lệch 1 nấc).

## CANON (embed vào prompt agent)
```
[G §6] Component này nên là 1 PROP của foundational (Button…) thay vì riêng? (fold-into-prop)
[C-props] Vai qua slot/prop CÓ TÊN; shape khác → variant/scenario tường minh (không emerge).
[C-size] Có prop `size` nếu kích thước biến thiên (button/chip/avatar…). Display tĩnh → N/A.
[C-skeleton] Tự render skeleton mirror qua prop `isSkeleton` (không để consumer dựng Skeleton rời).
[C-responsive] Xử lý bề rộng hẹp (stack/wrap/@app-sm). Áp cho layout ngang.
[§4-own] Tự ép sizing/style nội bộ (`[&_svg]:size-*`); consumer truyền children TRẦN.
[§5-icon] Icon-size theo TEXT-size (xs→4·sm→5·base→6) + interaction (arrow slide, rotate spin).
[C-anatomy] Anatomy MỖI leaf chỉ kể part leaf đó (nếu blockShell). Loaded KHÔNG kể Skeleton/Error.
[C-cluster] Cụm ≥2 element đồng-vai → 1 GROUP primitive (ButtonGroup…), không itemize rời.
[C-spacing] gap/padding thang `0·2·3·6·8`; card `p-3`; cấm ngoài thang (1/1.5/4/5/7/9).
```
> ⛔ KHÔNG chấm "thiếu nCn test".

## Script (neo bản đã chạy `audit-primitives-buttongroup-canon`)
```js
const prims = Array.isArray(args) ? args : JSON.parse(args)
const SCHEMA = { type:'object', properties:{ primitive:{type:'string'},
  gaps:{type:'array', items:{type:'object', properties:{check:{type:'string'}, severity:{type:'string',enum:['high','med','low']}, note:{type:'string'}}, required:['check','severity','note']}},
  summary:{type:'string'} }, required:['primitive','gaps','summary'] }
const results = await parallel(prims.map(p => () => agent(
  `Audit PORT-only primitive "${p}" (component=${p.split('/')[1]}) theo CANON… neo file:line, bỏ check N/A.`,
  { label:`audit:${p}`, phase:'Audit', schema:SCHEMA, model:'sonnet', effort:'medium' })))
```
`parallel` cap 16 concurrent — 99 primitive chạy ~7 batch, ổn. Model Sonnet (rẻ ×N).
