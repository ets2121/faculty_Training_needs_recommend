from pathlib import Path

file_path = Path("frontend/src/app/(dept-admin)/dept-dashboard/page.tsx")
content = file_path.read_text(encoding="utf-8")

# 1. Add useAuth import if not present
if "useAuth" not in content:
    content = content.replace(
        "import { useToast } from '@/context/ToastContext';",
        "import { useToast } from '@/context/ToastContext';\nimport { useAuth } from '@/context/AuthContext';"
    )

# 2. Add MapPin to lucide-react
if "MapPin" not in content:
    content = content.replace(
        "  Brain,\n} from 'lucide-react';",
        "  Brain,\n  MapPin,\n} from 'lucide-react';"
    )

# 3. Add authUser hook call
if "const { user: authUser } = useAuth();" not in content:
    content = content.replace(
        "export default function DeptDashboardPage() {\n",
        "export default function DeptDashboardPage() {\n  const { user: authUser } = useAuth();\n"
    )

# 4. Update Header banner to display Campus name alongside Department
old_header_tag = """          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
            <Building className="w-3.5 h-3.5 text-brand-green" />
            <span>Department Admin Overview</span>
          </div>"""

new_header_tag = """          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>{authUser?.campus?.name || 'QSU Campus'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
              <Building className="w-3.5 h-3.5 text-brand-green" />
              <span>{deptCode} Department</span>
            </span>
          </div>"""

content = content.replace(old_header_tag, new_header_tag)
file_path.write_text(content, encoding="utf-8")
print("DeptDashboardPage updated successfully with campus banner.")