<#
.SYNOPSIS
  Deterministic V2 gate for StarCi Academy Fullstack lessons + challenges.
  Free, repeatable, zero-token. Run BEFORE any LLM review — only escalate what passes structure.

.DESCRIPTION
  Walks a module dir (or a single lesson contents dir) and checks each lesson body
  (bodies/<lang>/{vi,en}.md) and each challenge (challenges/*/{vi,en}.md + submissions/0).
  Correctly parses the `# heading` / <!-- @starci/seperator --> / value / separator scalar
  format (the value sits 2 lines after the heading — grep/awk getline gets this wrong).

.PARAMETER Path
  A module dir (…/modules/13-frontend-performance) or a lesson contents dir.

.PARAMETER Mermaid
  Also validate every ```mermaid block via `npx @mermaid-js/mermaid-cli mmdc` (slow).

.PARAMETER Json
  Emit ONLY a machine-parseable {lessons:[{name,fails:[]}]} JSON (suppresses human output).
  The audit runner gate agent calls the script this way so it can copy the JSON straight into StructuredOutput.

.EXAMPLE
  ./.claude/docs/check-lesson.ps1 -Path ".mount/data/courses/0-fullstack-mastery/modules/13-frontend-performance"
  Exit code = number of FAIL findings (0 = clean).

.EXAMPLE
  powershell -NoProfile -File ".claude/docs/check-lesson.ps1" -Path "<module-dir>" -Json
  Prints JSON only; exit code still = number of FAIL findings.
#>
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [switch]$Mermaid,
  [switch]$Json   # emit machine-parseable {lessons:[{name,fails:[]}]} ONLY (for the audit runner gate agent)
)

$ErrorActionPreference = 'Stop'
$SEP = '<!-- @starci/seperator -->'
$script:fails = 0
$script:checks = 0
$script:results = [ordered]@{}   # lesson name -> list of fail messages (for -Json)

# Vietnamese diacritic char class (has-dau detector).
$VNDIA = '[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]'
# High-confidence no-diacritic Vietnamese tokens (rarely appear in English/code) — partial-leak detector.
$NODIA = '(?i)\b(khong|duoc|nhung|phai|kiem thu|chuan bi|khoi dong|ban chat|hoc vien|thuc hanh|tong ket|loi mo dau|cac khai niem|du lieu|truong hop bien)\b'

# Force-translation: technical term dịch ép vô nghĩa (audit-vietnamese §A.2) — PHẢI giữ tiếng Anh.
# CHỈ liệt kê phrase LUÔN sai; CỐ Ý bỏ các từ tự nhiên đúng ngữ cảnh (nhà cung cấp=vendor,
# điểm cuối=final score, tải trọng=load, "dưới lớp vỏ"=under the hood, "lớp vỏ thị giác").
$FORCETRANS = '(?i)(vỏ app|vỏ frontend|vỏ layout|tầng vỏ|config có kiểu|cấu hình có kiểu|trình nghe|bộ lắng nghe|giàn giáo|khung sườn|phần mềm trung gian|mã thông báo|bộ nhớ đệm|lớp bọc|trình bao bọc|kho[áa] phân tán|móc nối|hàng đợi thư chết|điểm hội tụ lỗi)'

# Flag Vietnamese-without-diacritics in a vi.md (body/challenge/artifact). $text already loaded.
function Check-Diacritics { param([string]$Text, [string]$Ctx)
  # strip code fences — comments inside are English by rule, không xét dấu ở đó
  $prose = [regex]::Replace($Text, '(?s)```.*?```', '')
  $dia = ([regex]::Matches($prose, $VNDIA)).Count
  # a real Vietnamese prose file always has diacritics; zero = whole-file no-dấu
  if ($prose.Trim().Length -gt 200 -and $dia -eq 0) {
    Fail $Ctx 'Vietnamese KHÔNG DẤU (toàn file vi không có dấu — phải đủ dấu)'
    return
  }
  # partial no-dấu: high-confidence tokens leaking in prose
  $hit = [regex]::Match($prose, $NODIA)
  if ($hit.Success) { Fail $Ctx ("Vietnamese KHÔNG DẤU (token '" + $hit.Value + "' — viết đủ dấu)"); return }
  # force-translation: technical term dịch ép vô nghĩa (§A.2) — phải giữ tiếng Anh
  $ft = [regex]::Match($prose, $FORCETRANS)
  if ($ft.Success) { Fail $Ctx ("Dịch ép thuật ngữ ('" + $ft.Value + "' — giữ tiếng Anh: Cache/Wrapper/Listener/Middleware/Distributed lock/Typed Config…)") } else { Pass $Ctx 'vn-co-dau' }
}

# Record a fail under its lesson (ctx = "<lesson>/..." or "<lesson>/ch:...").
function Record($ctx, $msg) {
  $lesson = ($ctx -split '/')[0]
  if (-not $script:results.Contains($lesson)) { $script:results[$lesson] = @() }
  $script:results[$lesson] += $msg
}
function Fail($ctx, $msg) { Record $ctx $msg; if (-not $Json) { Write-Host "  FAIL  [$ctx] $msg" -ForegroundColor Red }; $script:fails++; $script:checks++ }
function Pass($ctx, $msg) { $script:checks++ } # silent on pass; flip to Write-Host to see all
function Info($msg)       { if (-not $Json) { Write-Host $msg -ForegroundColor Cyan } }

# Sum every scalar value that appears under a given heading text (handles separator-wrapped values).
# Returns the list of numeric values found right after each occurrence of $heading.
function Get-ScalarsAfter {
  param([string[]]$Lines, [string]$Heading)
  $vals = @()
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i].Trim() -eq $Heading) {
      for ($j = $i + 1; $j -lt $Lines.Count; $j++) {
        $l = $Lines[$j].Trim()
        if ($l -eq '' -or $l -eq $SEP) { continue }
        $vals += $l; break
      }
    }
  }
  return $vals
}

function Test-FenceEven { param([string]$File)
  $n = @(Get-ContentLP $File | Select-String -Pattern '^```' -AllMatches).Count
  return @{ ok = ($n % 2 -eq 0); n = $n }
}

function Test-SepEven { param([string]$File)
  $n = @(Get-ContentLP $File | Select-String -Pattern ([regex]::Escape($SEP)) -SimpleMatch).Count
  return ($n % 2 -eq 0)
}

# ---- Lesson body checks -------------------------------------------------------
function Check-Body { param([string]$File, [string]$Ctx)
  if (-not (Test-Path $File)) { return }
  $lines = Get-Content -Path $File
  $text  = $lines -join "`n"

  # 1. Internal-note leak (must never reach student content)
  #    NOTE: 'backfill' is a legitimate database term (expand-contract migrations);
  #    it must NOT be a leak token or it false-positives on migration lessons.
  if ($text -match 'chủ nhiệm|Gemini|trợ giảng|Opus không chạy|runner gate|orchestrator') {
    Fail $Ctx "internal-note leak (chủ nhiệm/Gemini/Opus-không-chạy/runner)"
  } else { Pass $Ctx 'no-leak' }

  # 1b. Vietnamese diacritics — vi.md body PHẢI đủ dấu
  if ($Ctx -match '/vi$') { Check-Diacritics $text $Ctx }

  # 2. Inline flow-list enumeration — scoped to the 2.1.5 intro (before first ##### flow,
  #    or before the ::::accordion block for lessons already migrated to accordion format).
  #    (Prose elsewhere may legitimately use (1)(2); only the flow list must be bullets.)
  $t5 = ($lines | Select-String -Pattern '^#### 2\.1\.5\.' | Select-Object -First 1).LineNumber
  if ($t5) {
    $intro = ''
    for ($k = $t5; $k -lt $lines.Count; $k++) {
      if ($lines[$k] -match '^##### ' -or $lines[$k] -match '^::::accordion') { break }
      $intro += $lines[$k] + "`n"
    }
    if ($intro -match '\*\*\(1\)\*\*.*\*\*\(2\)\*\*') {
      Fail $Ctx 'inline (1)(2) in 2.1.5 flow-list (use bullets)'
    } else { Pass $Ctx 'bullet-list' }
  } else { Pass $Ctx 'bullet-list' }

  # 3. Fence parity
  $f = Test-FenceEven $File
  if (-not $f.ok) { Fail $Ctx "odd code-fence count ($($f.n)) — unclosed fence" } else { Pass $Ctx 'fence-even' }

  # 4. Theory = exactly 2 subsections (2.2.1 + 2.2.2)
  $theory = ($lines | Where-Object { $_ -match '^#### 2\.2\.\d' }).Count
  if ($theory -ne 2) { Fail $Ctx "theory has $theory subsections (must be 2)" } else { Pass $Ctx 'theory-2' }

  # 5. Full hands-on heading sequence 2.1.1–2.1.7 + 3.1 (V2 scheme)
  $missing = @()
  foreach ($h in @('2.1.1', '2.1.2', '2.1.3', '2.1.4', '2.1.5', '2.1.6', '2.1.7')) {
    $rx = '^#### ' + [regex]::Escape($h) + '\.'
    if (@($lines | Where-Object { $_ -match $rx }).Count -lt 1) { $missing += $h }
  }
  if (@($lines | Where-Object { $_ -match '^### 3\.1\.' }).Count -lt 1) { $missing += '3.1' }
  if ($missing.Count -gt 0) { Fail $Ctx "missing headings: $($missing -join ',')" } else { Pass $Ctx 'heading-seq' }
}

# ---- vi <-> en mirror (catch the "en is a different lesson" divergence) -------
function Check-Mirror { param([string]$Dir, [string]$Ctx)
  $vi = Join-Path $Dir 'vi.md'; $en = Join-Path $Dir 'en.md'
  if (-not (Test-Path $vi) -or -not (Test-Path $en)) { return }
  $viL = Get-Content $vi; $enL = Get-Content $en
  $viH = @($viL | Where-Object { $_ -match '^#{1,5} [0-9]' }).Count
  $enH = @($enL | Where-Object { $_ -match '^#{1,5} [0-9]' }).Count
  if ($viH -ne $enH) { Fail $Ctx "vi/en heading count differ (vi=$viH en=$enH) — divergence?" } else { Pass $Ctx 'mirror-headings' }
  $viFlow = @($viL | Where-Object { $_ -match '^##### 2\.1\.5\.' }).Count
  $enFlow = @($enL | Where-Object { $_ -match '^##### 2\.1\.5\.' }).Count
  if ($viFlow -ne $enFlow) { Fail $Ctx "vi/en flow count differ (vi=$viFlow en=$enFlow)" } else { Pass $Ctx 'mirror-flows' }
  $viF = (Select-String -Path $vi -Pattern '^```').Count
  $enF = (Select-String -Path $en -Pattern '^```').Count
  if ($viF -ne $enF) { Fail $Ctx "vi/en fence count differ (vi=$viF en=$enF)" } else { Pass $Ctx 'mirror-fence' }
}

# ---- Long-path helpers (Windows MAX_PATH 260) ---------------------------------
# Deep challenge slugs (insane) push submissions/0/en.md past 260 chars -> Test-Path/Get-Content
# return false/empty -> false-negative "missing submissions". Use \\?\ prefix via .NET File API.
function To-LongPath { param([string]$p)
  try { $abs = [System.IO.Path]::GetFullPath($p) } catch { return $p }
  if ($abs.Length -ge 248 -and $abs -notmatch '^\\\\\?\\') { return "\\?\$abs" }
  return $abs
}
function Test-PathLP { param([string]$p)
  $lp = To-LongPath $p
  return ([System.IO.File]::Exists($lp) -or [System.IO.Directory]::Exists($lp))
}
function Get-ContentLP { param([string]$p) return [System.IO.File]::ReadAllLines((To-LongPath $p)) }

# ---- Challenge checks ---------------------------------------------------------
function Check-Challenge { param([string]$Dir, [string]$Ctx)
  $vi  = Join-Path $Dir 'vi.md'
  $en  = Join-Path $Dir 'en.md'
  $sub = Join-Path $Dir 'submissions/0/en.md'
  if (-not (Test-Path $vi)) { return }
  $viLines = Get-Content $vi
  $viText  = ($viLines -join "`n")
  $enText  = if (Test-Path $en) { (Get-Content $en) -join "`n" } else { '' }

  # challenge vi.md PHẢI đủ dấu (title/description tiếng Việt)
  Check-Diacritics $viText "$Ctx/vi"

  # score = 100
  $sc = @(Get-ScalarsAfter $viLines '# score')
  if ($sc.Count -lt 1 -or "$($sc[0])" -ne '100') { Fail $Ctx "challenge score=$($sc -join ',') (must be 100)" } else { Pass $Ctx 'score-100' }

  # # verified present
  if ($viText -notmatch '(?m)^# verified') { Fail $Ctx 'missing # verified' } else { Pass $Ctx 'verified' }

  # no inline # references / # submissions
  if ($viText -match '(?m)^# (references|submissions)' -or $enText -match '(?m)^# (references|submissions)') {
    Fail $Ctx 'has inline # references/# submissions (V1)'
  } else { Pass $Ctx 'no-ref-sub' }

  # no '### ' section heading in challenge req/steps (must be :::muted callout).
  # V1 leak: '### 1.' (numbered) OR '### Mục đích/Ràng buộc/Gợi ý/Yêu cầu/Bước/Purpose/Constraints/Hints/Steps...'.
  # Gate trước chỉ bắt '### N.' (đánh số) → '### <chữ>' lọt (pass giả). Mở rộng để bắt cả heading chữ.
  # (?-i) = case-SENSITIVE: chỉ bắt heading tự do V1 (### Purpose / ### Mục đích) mà KHÔNG bắt
  # key cấu trúc V2 lowercase (### purpose / ### technicalConstraints / ### text / ### title ...).
  # PowerShell -match mặc định IgnoreCase → không thêm (?-i) thì 'Purpose' khớp luôn '### purpose' (false-positive).
  $h3rx = '(?-i)(?m)^### ([123]\.|Mục đích|Ràng buộc|Gợi ý|Yêu cầu|Các bước|Bước|Purpose|Technical constraints|Constraints|Requirements|Hints|Steps)'
  if ($viText -match $h3rx -or $enText -match $h3rx) {
    Fail $Ctx 'has ### section heading (Mục đích/Purpose/Steps... → dùng :::muted callout)'
  } else { Pass $Ctx 'no-section-heading' }

  # submission criteria sums
  if (-not (Test-PathLP $sub)) { Fail $Ctx 'missing submissions/0/en.md'; return }
  $subLines = Get-ContentLP $sub
  # split at # approachCriterias
  $aIdx = ($subLines | Select-String -Pattern '^# approachCriterias' | Select-Object -First 1).LineNumber
  $oIdx = ($subLines | Select-String -Pattern '^# outcomeCriterias'  | Select-Object -First 1).LineNumber
  if (-not $oIdx) { Fail $Ctx 'missing # outcomeCriterias' }
  if (-not $aIdx) { Fail $Ctx 'missing # approachCriterias' }
  if ($oIdx -and $aIdx) {
    $outBlock = $subLines[($oIdx-1)..($aIdx-2)]
    $appBlock = $subLines[($aIdx-1)..($subLines.Count-1)]
    $oSum = 0; foreach ($v in @(Get-ScalarsAfter $outBlock '### score')) { $oSum += [int]$v }
    $aSum = 0; foreach ($v in @(Get-ScalarsAfter $appBlock '### score')) { $aSum += [int]$v }
    if ($oSum -ne 30) { Fail $Ctx "outcomeCriterias score sum=$oSum (must be 30)" } else { Pass $Ctx 'outcome-30' }
    if ($aSum -ne 70) { Fail $Ctx "approachCriterias score sum=$aSum (must be 70)" } else { Pass $Ctx 'approach-70' }
    $crit = @((Get-ScalarsAfter $appBlock '### critical') | Where-Object { $_ -eq 'true' })
    if ($crit.Count -lt 1) { Fail $Ctx 'no critical:true in approach (core mechanism)' } else { Pass $Ctx 'has-critical' }
  }

  # separator parity on submission
  if (-not (Test-SepEven $sub)) { Fail $Ctx 'submission separator parity ODD' } else { Pass $Ctx 'sub-sep-even' }
}

# ---- FE-Vite cleanliness (catch un-migrated Next.js repos) --------------------
# Only FE lessons (have bodies/0-agnostic). Resolves the .repo frontend via code-context.md
# and fails if Next.js leftovers remain — so a half-migrated repo can't false-PASS the gate.
function Check-FrontendVite { param([string]$LessonDir, [string]$Ctx)
  $agnostic = Join-Path $LessonDir 'bodies/0-agnostic'
  if (-not (Test-Path $agnostic)) { return }              # BE 4-lang lesson -> Next check N/A
  # Next.js EXCEPTION: module dạy RSC/app-router (isSandbox=false) cố tình dùng Next → KHÔNG flag next.config
  # là "chưa migrate Vite" (false-positive). Đọc root vi.md `# isSandbox`; false = Next-intended -> waive.
  $rootVi = Join-Path $LessonDir 'vi.md'
  if (Test-Path $rootVi) {
    $sb = @(Get-ScalarsAfter (Get-Content $rootVi) '# isSandbox')
    if ($sb.Count -ge 1 -and "$($sb[0])" -match 'false') { Pass $Ctx 'next-exception (isSandbox=false, waive Vite-check)'; return }
  }
  $cc = Join-Path $LessonDir 'code-context.md'
  if (-not (Test-Path $cc)) { return }
  $m = [regex]::Match((Get-Content $cc -Raw), '\.repo/[^\s`''")]+/frontend')
  if (-not $m.Success) { return }
  $fe = $m.Value
  if (-not (Test-Path $fe)) { return }                    # repo not checked out -> skip
  $bad = @()
  foreach ($f in @('next.config.mjs', 'next.config.js', 'next.config.ts', 'next-env.d.ts')) {
    if (Test-Path (Join-Path $fe $f)) { $bad += $f }
  }
  if (Test-Path (Join-Path $fe 'app')) { $bad += 'app/ (Next app-router)' }
  $pkg = Join-Path $fe 'package.json'
  if (Test-Path $pkg) {
    $pkgText = Get-Content $pkg -Raw
    if ($pkgText -match '"next"\s*:')  { $bad += 'next dep in package.json' }
    if ($pkgText -notmatch '"vite"\s*:') { $bad += 'no vite dep' }
  }
  if (-not (Test-Path (Join-Path $fe 'index.html'))) { $bad += 'no index.html (Vite entry)' }
  if ($bad.Count -gt 0) { Fail $Ctx ("FE repo not clean Vite (migrate Next->Vite): " + ($bad -join ', ')) } else { Pass $Ctx 'fe-vite-clean' }
}

# ---- E2E proof checks ---------------------------------------------------------
# Rule (pipeline.md §Artifacts): each flow = its own file .e2e/<lang>/flow-<N>-<slug>-<status>.md
# (status: done|fail|require-creds). The old gathered single-file .e2e/proof.md is FORBIDDEN.
# A lesson claimed done (has claude_submitted.md) MUST carry per-flow proof — this is what
# previously let a gate-PASS lesson ship with NO e2e (gate was blind to e2e entirely).
function Check-E2E { param([string]$LessonDir, [string]$Ctx)
  # Only real lessons (have bodies/); a metadata-only/stub dir has nothing to prove.
  if (-not (Test-Path (Join-Path $LessonDir 'bodies'))) { return }
  $e2e     = Join-Path $LessonDir '.e2e'
  $claimed = Test-Path (Join-Path $LessonDir 'claude_submitted.md')
  $bad     = 0

  # 1. Old gathered format must be split into per-flow files (flag regardless of done-state).
  if (Test-Path (Join-Path $e2e 'proof.md')) {
    Fail $Ctx 'e2e format cũ gộp (.e2e/proof.md) — tách per-flow .e2e/<lang>/flow-N-slug-status.md'; $bad++
  }

  # Collect per-flow proof files anywhere under .e2e/.
  $flows = @()
  if (Test-Path $e2e) { $flows = @(Get-ChildItem -Path $e2e -Recurse -File -Filter 'flow-*.md' -ErrorAction SilentlyContinue) }

  if ($claimed) {
    # A done lesson MUST have per-flow proof — the core blindspot fix.
    if ($flows.Count -lt 1) { Fail $Ctx 'đã claude_submitted nhưng THIẾU e2e per-flow proof (.e2e/<lang>/flow-*.md)'; return }
    foreach ($fl in $flows) {
      # Each flow file must sit under a lang subdir (.e2e/<lang>/), not directly in .e2e/.
      $parent = Split-Path $fl.FullName -Parent
      if ((Split-Path $parent -Leaf) -eq '.e2e') { Fail $Ctx "e2e flow '$($fl.Name)' phải nằm trong .e2e/<lang>/ (vd agnostic/), không để thẳng .e2e/"; $bad++ }
      # Filename must end with a recognised status token. ('pass' = legacy alias of 'done'.)
      if ($fl.BaseName -notmatch '-(done|pass|fail|require-creds|require-rerun)$') { Fail $Ctx "e2e flow '$($fl.Name)' thiếu status hợp lệ (-done|-pass|-fail|-require-creds|-require-rerun)"; $bad++ }
      # A claimed-done lesson must not carry an unfinished flow (fail = lỗi, require-rerun = e2e chưa chạy lại).
      if ($fl.BaseName -match '-(fail|require-rerun)$') { Fail $Ctx "e2e flow '$($fl.Name)' chưa pass (fail/require-rerun) — lesson đã claude_submitted nhưng e2e chưa hoàn tất"; $bad++ }
    }
    if ($bad -eq 0) { Pass $Ctx 'e2e-per-flow' }
  } else {
    # Not claimed done yet: don't penalise missing e2e (audit loop will create it); only proof.md (above) is flagged.
    if ($bad -eq 0) { Pass $Ctx 'e2e-na' }
  }
}

# ---- cd-first + no-scaffold (run-block hygiene) -------------------------------
# Rule coding.md §A2: a fenced block with a RUN command (npm/mvn/dotnet/go/...) MUST open
# with a `cd ...` line. Block types handled to avoid false-positives on FE bodies:
#   - CLONE block (first real line is `git ...`)      -> exempt (its convention is `cd <lesson>` at the end).
#   - SCAFFOLD block (npm/yarn/pnpm create / create-*) -> FORBIDDEN (lessons use the cloned repo).
#   - RUN block (cd backend / cd frontend first)        -> the only one cd-first applies to.
function Check-CdFirst { param([string]$File, [string]$Ctx)
  if (-not (Test-Path $File)) { return }
  $runRx   = 'npm (install|ci|run|start)|pnpm (install|run|dev)|yarn (install|dev|build)|nest start|mvn |\./mvnw|gradle|dotnet (run|watch|restore|build|test)|go (run|build|mod|test)'
  $scaffRx = '(npm|yarn|pnpm) create |create-react-app|create-next-app|npm init |create vite'
  $infence = $false; $firstSet = $false; $run = $false; $cd = $false; $scaff = $false; $isClone = $false; $shellBlock = $false
  $bad = 0; $scaffBad = 0; $cdUp = 0
  foreach ($ln in (Get-Content $File)) {
    if ($ln -match '^```') {
      if ($infence) {                                              # closing -> evaluate block
        if ($shellBlock) {
          if ($scaff) { $scaffBad++ }
          elseif ($run -and -not $cd -and -not $isClone) { $bad++ }
        }
        $firstSet = $false; $run = $false; $cd = $false; $scaff = $false; $isClone = $false; $shellBlock = $false
        $infence = $false
      } else {                                                     # opening -> detect fence language
        $infence = $true
        $lang = $ln.TrimStart('`').Trim().ToLower()                # cd-first CHỈ áp fence shell; yaml/json/dockerfile/ts... exempt (vd GHA `- run: npm ci`)
        $shellBlock = ($lang -eq '' -or $lang -match '^(bash|sh|shell|shellscript|console|powershell|ps|ps1|pwsh|zsh|terminal|cmd|bat)$')
      }
      continue
    }
    if ($infence -and $shellBlock) {
      $trim = $ln.Trim()
      if (-not $firstSet -and $trim -ne '' -and $trim -notmatch '^#') { # first real line decides clone-exemption
        $firstSet = $true
        if ($trim -match '^git ') { $isClone = $true }
      }
      # Only count run/scaffold cmds on NON-comment lines — a comment quoting a run cmd
      # (vd `# Press Ctrl+C to stop nest start --watch`) KHÔNG phải lệnh thật → tránh false-positive ở block cleanup.
      if ($trim -notmatch '^#') {
        # cd BẤT KỲ dòng nào (nới: cho phép gộp docker-up → cd → install → run trong 1 block; cd chỉ cần đứng TRƯỚC run, KHÔNG bắt buộc dòng đầu).
        if ($trim -match '^cd ')  { $cd = $true }
        if ($ln -match $scaffRx) { $scaff = $true }
        if ($ln -match $runRx)   { $run = $true }
        # `cd ..` = vi phạm convention §A2 (mỗi terminal cd từ thư mục lesson; KHÔNG nhắc "quay lại").
        if ($trim -match '(^|&&\s*)cd \.\.(/|\s|$)') { $cdUp++ }
      }
    }
  }
  if ($scaffBad -gt 0) { Fail $Ctx "$scaffBad block SCAFFOLD (npm/yarn create...) — BỎ, dùng repo clone sẵn (§A2)" }
  if ($bad -gt 0)      { Fail $Ctx "$bad run-block thiếu cd-first (cd backend/<lang> | cd frontend trước lệnh npm/mvn/dotnet/go)" }
  if ($cdUp -gt 0)     { Fail $Ctx "$cdUp lệnh 'cd ..' trong run-block — BỎ (mỗi terminal cd từ thư mục lesson, KHÔNG nhắc quay lại; §A2)" }
  if ($scaffBad -eq 0 -and $bad -eq 0 -and $cdUp -eq 0) { Pass $Ctx 'cd-first' }
}

# ---- GitHub repo ref consistency ----------------------------------------------
# Rule contents.md §2.1.1: mọi `fullstack-mastery-module-<N>-<slug>` trong bodies của 1 lesson
# PHẢI là DUY NHẤT 1 giá trị (khớp tên .repo folder/remote). Catch vụ trộn 2 số (module-5 + module-6,
# module-9 + module-10) — off-by-one hay xảy ra do slot-prefix ≠ repo-N.
function Check-GithubRef { param([string]$LessonDir, [string]$Ctx)
  $bodies = Join-Path $LessonDir 'bodies'
  if (-not (Test-Path $bodies)) { return }
  $refs = @()
  foreach ($f in (Get-ChildItem -Path $bodies -Recurse -File -Filter '*.md' -ErrorAction SilentlyContinue)) {
    foreach ($mm in [regex]::Matches((Get-Content $f.FullName -Raw), 'fullstack-mastery-module-\d+-[a-z0-9-]+')) { $refs += $mm.Value }
  }
  if ($refs.Count -eq 0) { return }
  $distinct = @($refs | Sort-Object -Unique)
  if ($distinct.Count -gt 1) {
    Fail $Ctx ("github ref KHÔNG đồng nhất: " + ($distinct -join ' | ') + " (phải 1 module-N-slug khớp .repo)")
    return
  }
  Pass $Ctx 'github-consistent'
  # Khớp .repo THẬT: ref (1 giá trị) phải = tên folder .repo tồn tại (bắt off-by-one dù nội-bộ đồng nhất).
  # repo root = cha của .claude/docs (script ở .claude/docs/check-lesson.ps1). Bỏ qua nếu .repo chưa checkout.
  $repoDir = Join-Path (Split-Path $PSScriptRoot -Parent) '.repo'
  if (Test-Path $repoDir) {
    if (-not (Test-Path (Join-Path $repoDir $distinct[0]))) {
      Fail $Ctx ("github ref '" + $distinct[0] + "' KHÔNG khớp folder .repo nào (sai số module/off-by-one? slot-prefix ≠ repo-N)")
    } else { Pass $Ctx 'github-matches-repo' }
  }
}

# ---- Mermaid (optional) -------------------------------------------------------
function Check-Mermaid { param([string]$File, [string]$Ctx)
  $content = Get-Content $File -Raw
  $blocks = [regex]::Matches($content, '(?s)```mermaid\r?\n(.*?)```')
  $idx = 0
  foreach ($b in $blocks) {
    $idx++
    $tmp = Join-Path $env:TEMP ("mmd_" + [System.Guid]::NewGuid().ToString('N') + '.mmd')
    $svg = "$tmp.svg"
    Set-Content -Path $tmp -Value $b.Groups[1].Value -Encoding utf8
    & npx -y '@mermaid-js/mermaid-cli@latest' -i $tmp -o $svg *> $null
    if (-not (Test-Path $svg)) { Fail $Ctx "mermaid block #$idx failed to parse" } else { Pass $Ctx "mermaid-$idx"; Remove-Item $svg -Force }
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

# ---- Walk ---------------------------------------------------------------------
if (-not (Test-Path $Path)) { Write-Host "Path not found: $Path" -ForegroundColor Red; exit 2 }

# Determine lesson dirs: either Path/contents/* (module) or Path itself (single lesson)
$lessonDirs = @()
if (Test-Path (Join-Path $Path 'contents')) {
  $lessonDirs = Get-ChildItem -Path (Join-Path $Path 'contents') -Directory
} elseif (Test-Path (Join-Path $Path 'bodies')) {
  $lessonDirs = @(Get-Item $Path)
} else {
  # maybe Path is a course modules dir — walk modules
  $lessonDirs = Get-ChildItem -Path $Path -Directory -Recurse -Filter 'bodies' | ForEach-Object { $_.Parent }
}

foreach ($lesson in $lessonDirs) {
  $lname = $lesson.Name
  if (-not $script:results.Contains($lname)) { $script:results[$lname] = @() }  # ensure clean lessons show fails:[]
  Info "==== $lname ===="
  # V2 structure: lesson MUST have bodies/<lang>/ (content split). Root vi/en = metadata only.
  # A lesson with no bodies/ but with a content-bearing root vi.md = un-migrated V1 → FAIL
  # (otherwise the body checks below silently don't run and a V1 lesson false-PASSes).
  $bodiesDir = Join-Path $lesson.FullName 'bodies'
  $hasBodies = (Test-Path $bodiesDir) -and (@(Get-ChildItem -Path $bodiesDir -Directory -ErrorAction SilentlyContinue).Count -gt 0)
  if (-not $hasBodies) {
    $rootVi = Join-Path $lesson.FullName 'vi.md'
    if (Test-Path $rootVi) {
      Fail "$lname/body" 'V1 layout: missing bodies/<lang>/ — content phai tach vao bodies/, root vi/en chi metadata'
    }
  } else { Pass "$lname/body" 'has-bodies' }
  # bodies
  foreach ($bd in (Get-ChildItem -Path (Join-Path $lesson.FullName 'bodies') -Directory -ErrorAction SilentlyContinue)) {
    foreach ($lang in @('vi', 'en')) {
      Check-Body (Join-Path $bd.FullName "$lang.md") "$lname/$($bd.Name)/$lang"
      Check-CdFirst (Join-Path $bd.FullName "$lang.md") "$lname/$($bd.Name)/$lang"
      if ($Mermaid) { Check-Mermaid (Join-Path $bd.FullName "$lang.md") "$lname/$($bd.Name)/$lang" }
    }
    Check-Mirror $bd.FullName "$lname/$($bd.Name)"
  }
  # FE-Vite cleanliness (only FE lessons; resolves .repo frontend)
  Check-FrontendVite $lesson.FullName "$lname/frontend"
  # E2E proof: done lessons must carry per-flow proof; old gathered proof.md forbidden
  Check-E2E $lesson.FullName "$lname/e2e"
  # GitHub repo ref must be consistent (single module-N-slug khớp .repo)
  Check-GithubRef $lesson.FullName "$lname/github"
  # Artifacts nội bộ (research/decision/claude_submitted) cũng PHẢI tiếng Việt đủ dấu
  foreach ($art in @('research.md', 'decision.md', 'claude_submitted.md')) {
    $ap = Join-Path $lesson.FullName $art
    if (Test-Path $ap) { Check-Diacritics ((Get-Content $ap) -join "`n") "$lname/$art" }
  }
  # challenges
  foreach ($ch in (Get-ChildItem -Path (Join-Path $lesson.FullName 'challenges') -Directory -ErrorAction SilentlyContinue)) {
    Check-Challenge $ch.FullName "$lname/ch:$($ch.Name)"
  }
}

if ($Json) {
  # Emit ONLY the structured result so the runner gate agent can copy it verbatim into StructuredOutput.
  $lessonsOut = @(foreach ($k in $script:results.Keys) { [PSCustomObject]@{ name = $k; fails = @($script:results[$k]) } })
  # Wrap each fails as array; -Depth covers nesting. (Single-element arrays may render as scalar in PS5 —
  # the runner schema coerces back to array, so this stays correct.)
  [PSCustomObject]@{ lessons = $lessonsOut } | ConvertTo-Json -Depth 6
  exit $script:fails
}

Write-Host ""
if ($script:fails -eq 0) {
  Write-Host "PASS — $($script:checks) checks, 0 failures." -ForegroundColor Green
} else {
  Write-Host "FAIL — $($script:fails) failures of $($script:checks) checks." -ForegroundColor Red
}
exit $script:fails
