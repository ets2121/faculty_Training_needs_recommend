from pathlib import Path

root = Path(r"C:/Users/Admin/Desktop/qsu_training_recommender/faculty_Training_needs_recommend/frontend/src")

# Files and their specific replacements based on the grep output
replacements = {
    # dept-dashboard - text content only, keep icons/badges green
    "app/(dept-admin)/dept-dashboard/page.tsx": [
        ('font-bold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20', 'font-bold text-light-text dark:text-white bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20'),
        ('text-xs text-brand-green/90 bg-emerald-500/5 border border-brand-green/15 rounded-lg px-3 py-2', 'text-xs text-light-text dark:text-white bg-emerald-500/5 border border-brand-green/15 rounded-lg px-3 py-2'),
        ('text-[11px] text-brand-green font-semibold', 'text-[11px] text-light-text dark:text-white font-semibold'),
        ('text-xs text-brand-green font-semibold">', 'text-xs text-light-text dark:text-white font-semibold">'),
        ('text-[11px] font-mono text-brand-green">', 'text-[11px] font-mono text-light-text dark:text-white">'),
    ],
    # register-faculty - heading and body text
    "app/(dept-admin)/register-faculty/page.tsx": [
        ('<h1 className="text-2xl font-extrabold text-brand-green">Create New Faculty Account</h1>', '<h1 className="text-2xl font-extrabold text-light-text dark:text-white">Create New Faculty Account</h1>'),
    ],
    # faculty-dashboard - body text for rank/degree
    "app/(faculty)/faculty-dashboard/page.tsx": [
        ('text-brand-green font-semibold">{faculty.academic_rank', 'text-light-text dark:text-white font-semibold">{faculty.academic_rank'),
        ('text-brand-green font-semibold">{faculty.highest_degree', 'text-light-text dark:text-white font-semibold">{faculty.highest_degree'),
    ],
    # questionnaire - status text
    "app/(faculty)/questionnaire/page.tsx": [
        ('text-xs text-brand-green font-semibold">', 'text-xs text-light-text dark:text-white font-semibold">'),
    ],
    # admin-dashboard - text content
    "app/(sys-admin)/admin-dashboard/page.tsx": [
        ('text-[10px] font-mono text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20', 'text-[10px] font-mono text-light-text dark:text-white bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20'),
        ('inline-flex items-center gap-1 bg-brand-green/15 text-brand-green border border-brand-green/30', 'inline-flex items-center gap-1 bg-brand-green/15 text-light-text dark:text-white border border-brand-green/30'),
        ('text-[11px] text-brand-green font-semibold">{u.status}</span>', 'text-[11px] text-light-text dark:text-white font-semibold">{u.status}</span>'),
        ('<h1 className="text-2xl font-extrabold text-brand-green tracking-tight">', '<h1 className="text-2xl font-extrabold text-light-text dark:text-white tracking-tight">'),
        ('text-[11px] font-mono text-brand-green mt-0.5">{form.training_id}', 'text-[11px] font-mono text-light-text dark:text-white mt-0.5">{form.training_id}'),
        ('text-[11px] text-brand-green">', 'text-[11px] text-light-text dark:text-white">'),
    ],
    # register-admin - heading
    "app/(sys-admin)/register-admin/page.tsx": [
        ('<h1 className="text-2xl font-extrabold text-brand-green">Register Department Admin Account</h1>', '<h1 className="text-2xl font-extrabold text-light-text dark:text-white">Register Department Admin Account</h1>'),
    ],
    # about - text content
    "app/about/page.tsx": [
        ('text-3xl sm:text-4xl font-extrabold text-brand-green tracking-tight leading-tight', 'text-3xl sm:text-4xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight'),
        ('text-[10px] font-mono text-brand-green bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20', 'text-[10px] font-mono text-light-text dark:text-white bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20'),
        ('font-mono text-xs text-brand-green leading-relaxed space-y-1', 'font-mono text-xs text-light-text dark:text-white leading-relaxed space-y-1'),
        ('<code className="text-brand-green font-mono text-[11px]', '<code className="text-light-text dark:text-white font-mono text-[11px]'),
    ],
    # landing - text content
    "app/page.tsx": [
        ('text-4xl sm:text-5xl font-extrabold text-brand-green tracking-tight leading-tight', 'text-4xl sm:text-5xl font-extrabold text-light-text dark:text-white tracking-tight leading-tight'),
    ],
    # QuestionnairePartForm - text content only, not input borders
    "components/QuestionnairePartForm.tsx": [
        ('text-brand-green">{compData.proficiency} / 5', 'text-light-text dark:text-white">{compData.proficiency} / 5'),
        ('text-brand-green w-6 text-right">{needVal}', 'text-light-text dark:text-white w-6 text-right">{needVal}'),
    ],
    # RecommendationCard - text content only, keep icon accents
    "components/RecommendationCard.tsx": [
        ('text-xs font-mono font-bold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20', 'text-xs font-mono font-bold text-light-text dark:text-white bg-brand-green/10 px-2.5 py-0.5 rounded border border-brand-green/20'),
        ('text-brand-green">primary action items', 'text-light-text dark:text-white">primary action items'),
    ],
    # UserModals - text content
    "components/UserModals.tsx": [
        ('<h4 className="text-xs font-bold text-brand-green uppercase tracking-wider', '<h4 className="text-xs font-bold text-light-text dark:text-white uppercase tracking-wider'),
        ('<span className="font-mono text-brand-green">@{user.username}</span>', '<span className="font-mono text-light-text dark:text-white">@{user.username}</span>'),
    ],
    # ProgressBar - badge/step text
    "components/ProgressBar.tsx": [
        ('bg-brand-green/10 text-brand-green border border-brand-green/20 font-mono', 'bg-brand-green/10 text-light-text dark:text-white border border-brand-green/20 font-mono'),
        ("'bg-brand-green/20 border-brand-green text-brand-green ring-2 ring-brand-green/30'", "'bg-brand-green/20 border-brand-green text-light-text dark:text-white ring-2 ring-brand-green/30'"),
    ],
    # Skeletons - text
    "components/Skeletons.tsx": [
        ('text-xs text-brand-green font-mono flex items-center gap-1.5 pt-0.5', 'text-xs text-light-text dark:text-white font-mono flex items-center gap-1.5 pt-0.5'),
    ],
    # Sidebar - nav text
    "components/Sidebar.tsx": [
        ("'bg-brand-green/15 text-brand-green border-brand-green/30 shadow-sm'", "'bg-brand-green/15 text-light-text dark:text-white border-brand-green/30 shadow-sm'"),
        ("isActive ? 'text-brand-green' : 'text-light-text dark:text-dark-muted'", "isActive ? 'text-light-text dark:text-white' : 'text-light-text dark:text-dark-muted'"),
    ],
    # Navbar - body text
    "components/Navbar.tsx": [
        ('<h1 className="text-sm font-bold text-brand-green tracking-tight flex items-center gap-2">', '<h1 className="text-sm font-bold text-light-text dark:text-white tracking-tight flex items-center gap-2">'),
    ],
    # my-recommendation - link text
    "app/(faculty)/my-recommendation/page.tsx": [
        ('text-xs text-light-text dark:text-dark-muted hover:text-brand-green transition-colors', 'text-xs text-light-text dark:text-dark-muted hover:text-brand-green-dark transition-colors'),
    ],
    # login - link text
    "app/login/page.tsx": [
        ('text-xs text-light-text dark:text-dark-muted hover:text-brand-green font-medium transition-colors', 'text-xs text-light-text dark:text-dark-muted hover:text-brand-green-dark font-medium transition-colors'),
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
