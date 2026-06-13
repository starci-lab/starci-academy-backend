#!/usr/bin/env python3
import json
import sys

with open('fe-i18n-table.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Filter for target namespaces
target = [d for d in data if any(d['k'].startswith(ns) for ns in ['finalProject.', 'task.', 'course.', 'module.', 'courses.', 'modules.', 'lesson.'])]

findings = []

for item in target:
    k = item['k']
    en = item['en']
    vi = item['vi']
    
    issue = None
    new_vi = None
    
    # §A: Check for force-translation of technical terms that should stay English
    # "task" in placeholder should use "task" not translate it
    if k == 'finalProject.page.searchTaskPlaceholder':
        if vi == 'Tìm task...':
            # OK - task is kept in English as technical term
            pass
    
    # Check "Feedback" - should stay English not translate to "Đánh giá/Phản hồi"
    if 'feedback' in k.lower() and k != 'finalProject.page.feedback.title' and k != 'finalProject.page.feedback.content':
        # Most feedback keys use "Feedback" - that's OK (English technical term)
        if vi.lower() == 'feedback':
            # OK - stays English
            pass
    
    # Check column headers and table labels
    if k == 'finalProject.page.history.columns.feedback':
        if vi == 'Feedback':
            # OK - column header, acceptable to keep English
            pass
    
    # §B: Check for calque / word-by-word translation issues
    
    # "Missing repo for review" - check Vietnamese phrasing
    if k == 'finalProject.page.submitGithub.missingRepoForReview':
        expected = 'Nhập và lưu URL GitHub hợp lệ trước.'
        if vi == expected:
            # OK
            pass
    
    # Check for awkward phrasing like "một cách", thừa từ, sai trật tự
    
    # "previewLockedAlertDescription" - check for awkwardness
    if k == 'task.previewLockedAlertDescription':
        # Check if the Vietnamese is natural
        if 'Bạn vẫn xem được tiêu chí của bài này. Đánh giá AI, xem phản hồi/lịch sử và chỉnh GitHub chỉ bật sau khi hoàn thành bước trước.' == vi:
            # Hmm, "chỉ bật" is a bit odd - should be something like "chỉ được bật" 
            issue = 'calque'
            new_vi = 'Bạn vẫn xem được tiêu chí của bài này. Đánh giá AI, xem phản hồi/lịch sử và chỉnh GitHub chỉ được bật sau khi hoàn thành bước trước.'
    
    # Check "Grading language" - is this correctly translated?
    if k == 'finalProject.page.submitGithub.langFieldTitle':
        if vi == 'Ngôn ngữ chấm điểm':
            # OK - natural Vietnamese
            pass
    
    # Milestone terminology - check if consistent
    if 'milestone' in k.lower():
        # Should check if using "Milestone" (keep) or "Chặng", "Giai đoạn" etc
        if vi == 'Milestone dự án cá nhân':
            # OK - keeping Milestone as business term
            pass
    
    # Check inconsistencies between similar keys
    
    # "task" translation - should be consistent if used in multiple places
    if 'task' in k.lower():
        if k == 'finalProject.page.searchTaskPlaceholder' and vi == 'Tìm task...':
            # OK
            pass
    
    # Now check for missing diacritics / typos
    # Vietnamese MUST have proper diacritical marks
    
    # Check for common mistakes
    if 'cua' in vi and 'của' not in vi:
        # Missing diacritics on "của"
        if 'của' in en.lower():
            # This is a typo
            issue = 'mistranslate'  # Well, missing diacritics
    
    # §C: Missing diacritics / sai chính tả / lẫn ký tự lạ
    # This is hard to detect without knowing which characters should have marks
    # We can check for common patterns
    
    # Check if any entries have mojibake or encoding issues
    if '?' in vi or '�' in vi:
        issue = 'mistranslate'
        new_vi = vi.replace('?', '').replace('�', '')
    
    # Final check: inconsistent terminology
    # "Feedback" vs other spellings
    
    if issue and new_vi:
        findings.append({
            'k': k,
            'oldVi': vi,
            'newVi': new_vi,
            'issue': issue
        })

print(json.dumps(findings, ensure_ascii=False))
