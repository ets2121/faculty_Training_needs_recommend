from pathlib import Path

file_path = Path('frontend/src/app/(sys-admin)/admin-dashboard/page.tsx')
content = file_path.read_text(encoding='utf-8')

# 1. Add TransferFacultyModal import
content = content.replace(
    "import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';",
    "import { ViewEditUserModal, DeleteUserModal } from '@/components/UserModals';\nimport TransferFacultyModal from '@/components/TransferFacultyModal';"
)

# 2. Add MapPin, ArrowRightLeft, Building to lucide-react imports
content = content.replace(
    "  Key,\n} from 'lucide-react';",
    "  Key,\n  MapPin,\n  ArrowRightLeft,\n  Building,\n} from 'lucide-react';"
)

# 3. Add campus filter and transfer modal state to component
old_state = "  // User modals state\n  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);\n  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);"
new_state = """  // Campus filter and transfer state
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('all');
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<UserListItem | null>(null);

  // User modals state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserListItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserListItem | null>(null);"""
content = content.replace(old_state, new_state)

# 4. Update filteredUsers to respect campus filter
old_filter = """  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.department_code && u.department_code.toLowerCase().includes(q)) ||
        (u.status && u.status.toLowerCase().includes(q))
    );
  }, [users, userSearch]);"""

new_filter = """  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedCampusFilter !== 'all' && u.campus_code !== selectedCampusFilter) {
        return false;
      }
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase().trim();
      return (
        u.username.toLowerCase().includes(q) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q) ||
        (u.campus_code && u.campus_code.toLowerCase().includes(q)) ||
        (u.department_code && u.department_code.toLowerCase().includes(q)) ||
        (u.status && u.status.toLowerCase().includes(q))
      );
    });
  }, [users, selectedCampusFilter, userSearch]);"""
content = content.replace(old_filter, new_filter)

# 5. Add campus filter pills to User tab header
old_table_header = """                {/* Debounced Search */}
                <div className="w-full sm:w-72">
                  <SearchInput
                    placeholder="Search users by name, role, dept..."
                    onChange={(val) => setUserSearch(val)}
                  />
                </div>
              </div>"""

new_table_header = """                <div className="flex flex-wrap items-center gap-3">
                  {/* Campus Filter Pills */}
                  <div className="flex items-center gap-1 bg-light-bg dark:bg-dark-bg p-1 rounded-xl border border-light-border dark:border-dark-border">
                    {(['all', 'DIFFUN', 'MADDELA', 'CABARROGUIS'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCampusFilter(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          selectedCampusFilter === c
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'text-light-text dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
                        }`}
                      >
                        {c === 'all' ? 'All Campuses' : c}
                      </button>
                    ))}
                  </div>

                  {/* Debounced Search */}
                  <div className="w-full sm:w-64">
                    <SearchInput
                      placeholder="Search users by name, role, dept..."
                      onChange={(val) => setUserSearch(val)}
                    />
                  </div>
                </div>
              </div>"""
content = content.replace(old_table_header, new_table_header)

# 6. Update Role badges in User table to support campus_admin
old_role_badge = """                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                u.role === 'system_admin' ? 'bg-rose-500/10 text-light-text dark:text-white border-rose-500/20' :
                                u.role === 'department_admin' ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' :
                                'bg-brand-green/10 text-brand-green border-brand-green/20'
                              }`}"""

new_role_badge = """                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                u.role === 'system_admin' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                                u.role === 'campus_admin' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' :
                                u.role === 'department_admin' ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' :
                                'bg-brand-green/10 text-brand-green border-brand-green/20'
                              }`}"""
content = content.replace(old_role_badge, new_role_badge)

# 7. Update Department column in User table to show Campus too
old_dept_td = """                            <td className="p-3.5">
                              {u.department_code ? (
                                <span className="text-xs font-mono font-semibold bg-light-bg dark:bg-dark-bg px-2 py-0.5 rounded border border-light-border dark:border-dark-border">
                                  {u.department_code}
                                </span>
                              ) : (
                                <span className="text-light-text dark:text-dark-muted font-mono">-</span>
                              )}
                            </td>"""

new_dept_td = """                            <td className="p-3.5">
                              <div className="flex flex-col gap-0.5">
                                {u.campus_code && (
                                  <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                                    {u.campus_code}
                                  </span>
                                )}
                                {u.department_code ? (
                                  <span className="text-xs font-mono font-semibold bg-light-bg dark:bg-dark-bg px-2 py-0.5 rounded border border-light-border dark:border-dark-border w-fit">
                                    {u.department_code}
                                  </span>
                                ) : (
                                  <span className="text-light-text dark:text-dark-muted font-mono text-[11px]">{u.role === 'system_admin' ? 'System-wide' : u.role === 'campus_admin' ? 'Campus Admin' : '—'}</span>
                                )}
                              </div>
                            </td>"""
content = content.replace(old_dept_td, new_dept_td)

# 8. Add Transfer Faculty action button in table
old_actions_td = """                                  <button
                                    onClick={() => setSelectedUserForEdit(u)}
                                    title="Edit User"
                                    className="w-7 h-7 rounded-lg bg-light-bg dark:bg-dark-bg hover:bg-brand-green/20 text-light-text dark:text-dark-muted hover:text-brand-green flex items-center justify-center transition-all"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>"""

new_actions_td = """                                  {u.role === 'faculty' && (
                                    <button
                                      onClick={() => setSelectedUserForTransfer(u)}
                                      title="Transfer Faculty to Campus/Department"
                                      className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center transition-all"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectedUserForEdit(u)}
                                    title="Edit User"
                                    className="w-7 h-7 rounded-lg bg-light-bg dark:bg-dark-bg hover:bg-brand-green/20 text-light-text dark:text-dark-muted hover:text-brand-green flex items-center justify-center transition-all"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>"""
content = content.replace(old_actions_td, new_actions_td)

# 9. Render TransferFacultyModal at the bottom of the component
old_modals_end = """      {/* Delete User Modal */}
      {selectedUserForDelete && (
        <DeleteUserModal
          user={selectedUserForDelete}
          onClose={() => setSelectedUserForDelete(null)}
          onDeleted={loadData}
        />
      )}"""

new_modals_end = """      {/* Transfer Faculty Modal */}
      {selectedUserForTransfer && (
        <TransferFacultyModal
          user={selectedUserForTransfer}
          onClose={() => setSelectedUserForTransfer(null)}
          onTransferred={loadData}
        />
      )}

      {/* Delete User Modal */}
      {selectedUserForDelete && (
        <DeleteUserModal
          user={selectedUserForDelete}
          onClose={() => setSelectedUserForDelete(null)}
          onDeleted={loadData}
        />
      )}"""
content = content.replace(old_modals_end, new_modals_end)

file_path.write_text(content, encoding='utf-8')
print('Admin dashboard updated successfully.')