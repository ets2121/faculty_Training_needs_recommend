from pathlib import Path

root = Path(r"C:/Users/Admin/Desktop/qsu_training_recommender/faculty_Training_needs_recommend/frontend/src")

replacements = {
    "app/(dept-admin)/dept-dashboard/page.tsx": [
        ('text-2xl font-extrabold text-brand-green tracking-tight">', 'text-2xl font-extrabold text-light-text dark:text-white tracking-tight">'),
        ('text-xs font-mono font-bold text-brand-green">Department Recommendation Output', 'text-xs font-mono font-bold text-light-text dark:text-white">Department Recommendation Output'),
        ('text-brand-green font-semibold">{formattedDeptTime}', 'text-light-text dark:text-white font-semibold">{formattedDeptTime}'),
    ],
    "app/(dept-admin)/register-faculty/page.tsx": [
        ('text-2xl font-extrabold text-brand-green">Create New Faculty Account', 'text-2xl font-extrabold text-light-text dark:text-white">Create New Faculty Account'),
    ],
    "app/(faculty)/faculty-dashboard/page.tsx": [
        ('text-2xl font-extrabold text-brand-green tracking-tight">', 'text-2xl font-extrabold text-light-text dark:text-white tracking-tight">'),
        ('text-brand-green font-semibold">{faculty.academic_rank', 'text-light-text dark:text-white font-semibold">{faculty.academic_rank'),
        ('text-brand-green font-semibold">{faculty.highest_degree', 'text-light-text dark:text-white font-semibold">{faculty.highest_degree'),
    ],
    "app/(faculty)/questionnaire/page.tsx": [
        ('text-xs text-brand-green font-semibold">', 'text-xs text-light-text dark:text-white font-semibold">'),
    ],
    "app/(sys-admin)/admin-dashboard/page.tsx": [
        ('text-brand-green font-bold">*', 'text-light-text dark:text-white font-bold">*'),
        ('text-[10px] text-brand-green hover:text-rose-300 font-semibold transition-colors', 'text-[10px] text-light-text dark:text-white hover:text-rose-300 font-semibold transition-colors'),
        ("text-brand-green font-medium' : 'text-light-text dark:text-dark-text'", "text-light-text dark:text-white font-medium' : 'text-light-text dark:text-dark-text'"),
        ('text-[11px] text-brand-green">', 'text-[11px] text-light-text dark:text-white">'),
        ('text-base font-extrabold text-brand-green tracking-tight', 'text-base font-extrabold text-light-text dark:text-white tracking-tight'),
        ('text-[11px] font-mono text-brand-green mt-0.5">{form.training_id}', 'text-[11px] font-mono text-light-text dark:text-white mt-0.5">{form.training_id}'),
        ('text-[11px] text-brand-green font-semibold">{u.status}', 'text-[11px] text-light-text dark:text-white font-semibold">{u.status}'),
        ("bg-rose-500/10 text-brand-green border-rose-500/20' :", "bg-rose-500/10 text-light-text dark:text-white border-rose-500/20' :"),
    ],
    "app/(sys-admin)/register-admin/page.tsx": [
        ('text-2xl font-extrabold text-brand-green">Register Department Admin Account', 'text-2xl font-extrabold text-light-text dark:text-white">Register Department Admin Account'),
    ],
    "app/about/page.tsx": [
        ('text-3xl sm:text-4xl font-extrabold text-brand-green tracking-tight leading-tight', 'text-3xl sm:text-4xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight'),
        ('text-[10px] font-mono text-brand-green">1', 'text-[10px] font-mono text-light-text dark:text-white">1'),
        ('font-mono text-xs text-brand-green leading-relaxed space-y-1', 'font-mono text-xs text-light-text dark:text-white leading-relaxed space-y-1'),
    ],
    "app/page.tsx": [
        ('text-4xl sm:text-5xl font-extrabold text-brand-green tracking-tight leading-tight', 'text-4xl sm:text-5xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight'),
    ],
    "components/QuestionnairePartForm.tsx": [
        ('text-brand-green">{compData.proficiency} / 5', 'text-light-text dark:text-white">{compData.proficiency} / 5'),
        ('text-brand-green w-6 text-right">{needVal}', 'text-light-text dark:text-white w-6 text-right">{needVal}'),
    ],
    "components/RecommendationCard.tsx": [
        ('text-xs font-mono font-bold text-brand-green">AI Recommendation Engine', 'text-xs font-mono font-bold text-light-text dark:text-white">AI Recommendation Engine'),
        ('text-brand-green">primary action items', 'text-light-text dark:text-white">primary action items'),
        ('text-xs text-brand-green/90 bg-emerald-500/5 border border-brand-green/15 rounded-lg px-3 py-2', 'text-xs text-light-text dark:text-white bg-emerald-500/5 border border-brand-green/15 rounded-lg px-3 py-2'),
    ],
    "components/UserModals.tsx": [
        ('<h4 className="text-xs font-bold text-brand-green uppercase tracking-wider flex items-center gap-1.5">', '<h4 className="text-xs font-bold text-light-text dark:text-white uppercase tracking-wider flex items-center gap-1.5">'),
        ('<span className="font-mono text-brand-green">@{user.username}</span>', '<span className="font-mono text-light-text dark:text-white">@{user.username}</span>'),
    ],
}

changed_files = []
for rel_path, reps in replacements.items():
    file_path = root / rel_path
    if not file_path.exists():
        print(f"Missing: {file_path}")
        continue
    content = file_path.read_text(encoding="utf-8")
    original = content
    for old, new in reps:
        if old in content:
            content = content.replace(old, new)
        else:
            print(f"  NOT FOUND in {rel_path}: {old[:80]}...")
    if content != original:
        file_path.write_text(content, encoding="utf-8")
        changed_files.append(rel_path)

print("\nChanged files:")
for f in changed_files:
    print(f"- {f}")
