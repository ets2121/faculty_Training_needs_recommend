from pathlib import Path

file_path = Path("frontend/src/components/Sidebar.tsx")
content = file_path.read_text(encoding="utf-8")

# Add Cpu, BookOpen to lucide-react imports if missing
content = content.replace(
  "  Building,\n  Layers,\n} from 'lucide-react';",
  "  Building,\n  Layers,\n  Cpu,\n  BookOpen,\n  Users,\n} from 'lucide-react';"
)

old_sys_nav = """  const sysAdminNav = [
    { href: '/admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
    { href: '/register-admin', label: 'Add Administrator', icon: UserPlus },
  ];"""

new_sys_nav = """  const sysAdminNav = [
    { href: '/admin-dashboard', label: 'System Overview', icon: LayoutDashboard },
    { href: '/user-management', label: 'Users & RBAC', icon: Users },
    { href: '/catalog-management', label: 'Training Catalog', icon: BookOpen },
    { href: '/ml-pipeline', label: 'ML Pipeline & Retrain', icon: Cpu },
    { href: '/register-admin', label: 'Add Administrator', icon: UserPlus },
  ];"""

content = content.replace(old_sys_nav, new_sys_nav)
file_path.write_text(content, encoding="utf-8")
print("Sidebar.tsx updated with dedicated sys-admin routes.")