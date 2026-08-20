from pathlib import Path

file_path = Path("frontend/src/components/Sidebar.tsx")
content = file_path.read_text(encoding="utf-8")

old_campus_nav = """  const campusAdminNav = [
    { href: '/campus-dashboard', label: 'Campus Overview', icon: LayoutDashboard },
    { href: '/register-admin', label: 'Add Dept Admin', icon: UserPlus },
  ];"""

new_campus_nav = """  const campusAdminNav = [
    { href: '/campus-dashboard', label: 'Campus Overview', icon: LayoutDashboard },
    { href: '/campus-faculty', label: 'Campus Faculty Roster', icon: Users },
    { href: '/campus-recommendations', label: 'Campus AI Synthesis', icon: Sparkles },
    { href: '/campus-departments', label: 'Academic Departments', icon: Building },
    { href: '/register-admin', label: 'Add Dept Admin', icon: UserPlus },
  ];"""

content = content.replace(old_campus_nav, new_campus_nav)
file_path.write_text(content, encoding="utf-8")
print("Sidebar.tsx updated with dedicated campus-admin routes.")