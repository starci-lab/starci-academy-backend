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
  ./.audits/check-lesson.ps1 -Path ".mount/data/courses/0-fullstack-mastery/modules/13-frontend-performance"
  Exit code = number of FAIL findings (0 = clean).

.EXAMPLE
  powershell -NoProfile -File ".audits/check-lesson.ps1" -Path "<module-dir>" -Json
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
  if ($hit.Success) { Fail $Ctx ("Vietnamese KHÔNG DẤU (token '" + $hit.Value + "' — viết đủ dấu)") } else { Pass $Ctx 'vn-co-dau' }
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
  $n = (Select-String -Path $File -Pattern '^```' -AllMatches).Count
  return @{ ok = ($n % 2 -eq 0); n = $n }
}

function Test-SepEven { param([string]$File)
  $n = (Select-String -Path $File -Pattern ([regex]::Escape($SEP)) -SimpleMatch).Count
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

  # 2. Inline flow-list enumeration — scoped to the 2.1.5 intro (before first ##### flow).
  #    (Prose elsewhere may legitimately use (1)(2); only the flow list must be bullets.)
  $t5 = ($lines | Select-String -Pattern '^#### 2\.1\.5\.' | Select-Object -First 1).LineNumber
  if ($t5) {
    $intro = ''
    for ($k = $t5; $k -lt $lines.Count; $k++) {
      if ($lines[$k] -match '^##### ') { break }
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

  # no '### N.' heading (must be :::muted callout)
  if ($viText -match '(?m)^### [123]\. ' -or $enText -match '(?m)^### [123]\. ') {
    Fail $Ctx 'has ### N. heading (use :::muted)'
  } else { Pass $Ctx 'no-numbered-heading' }

  # submission criteria sums
  if (-not (Test-Path $sub)) { Fail $Ctx 'missing submissions/0/en.md'; return }
  $subLines = Get-Content $sub
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
      if ($Mermaid) { Check-Mermaid (Join-Path $bd.FullName "$lang.md") "$lname/$($bd.Name)/$lang" }
    }
    Check-Mirror $bd.FullName "$lname/$($bd.Name)"
  }
  # FE-Vite cleanliness (only FE lessons; resolves .repo frontend)
  Check-FrontendVite $lesson.FullName "$lname/frontend"
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
