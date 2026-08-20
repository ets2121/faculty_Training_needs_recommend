from pathlib import Path

file_path = Path("frontend/src/components/QuestionnairePartForm.tsx")
content = file_path.read_text(encoding="utf-8")

# Add Building, MapPin to lucide-react imports if not present
if "Building" not in content:
    content = content.replace(
        "import { Save, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';",
        "import { Save, ArrowRight, ArrowLeft, CheckCircle, Building, MapPin, Lock } from 'lucide-react';"
    )

# Replace Part 1 department select with locked badge
old_part1_dept = """          <div>
            <label className=\"block text-xs font-medium text-light-text dark:text-dark-text mb-1\">Department</label>
            <select
              value={formData.department || 'BSIT'}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className=\"w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none\"
            >
              {['BSIT', 'BSED', 'BSCE', 'BEED', 'BSBA', 'BSCS', 'BAELS', 'BSMATH', 'BSHM', 'BSMidwifery'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>"""

new_part1_dept = """          <div className=\"space-y-1\">
            <label className=\"block text-xs font-semibold text-light-text dark:text-dark-text mb-1\">
              Assigned Department
            </label>
            <div className=\"flex items-center justify-between p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-xs\">
              <div className=\"flex items-center gap-2\">
                <Building className=\"w-4 h-4 text-brand-gold shrink-0\" />
                <span className=\"font-bold font-mono text-light-text dark:text-white\">
                  {formData.department || 'BSIT'}
                </span>
              </div>
              <span className=\"inline-flex items-center gap-1 text-[10px] text-light-text dark:text-dark-muted font-mono bg-white dark:bg-dark-card px-2 py-0.5 rounded border border-light-border dark:border-dark-border\">
                <Lock className=\"w-3 h-3 text-emerald-500\" />
                <span>Pre-assigned</span>
              </span>
            </div>
            <p className=\"text-[11px] text-light-text dark:text-dark-muted\">
              Automatically locked based on your institutional appointment.
            </p>
          </div>"""

content = content.replace(old_part1_dept, new_part1_dept)
file_path.write_text(content, encoding="utf-8")
print("QuestionnairePartForm.tsx updated successfully.")