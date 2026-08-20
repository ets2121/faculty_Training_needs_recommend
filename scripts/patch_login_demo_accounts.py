from pathlib import Path

file_path = Path("frontend/src/app/login/page.tsx")
content = file_path.read_text(encoding="utf-8")

old_accounts_block = """                <button
                  type="button"
                  onClick={() => autofill('admin', 'admin123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-rose-500/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-rose-600 transition-colors">admin</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">System Administrator</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-600 dark:text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    system_admin
                  </span>
                </button>"""

new_accounts_block = """                <button
                  type="button"
                  onClick={() => autofill('admin', 'admin123')}
                  className="w-full text-left p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card hover:border-rose-500/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-rose-600 transition-colors">admin</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">System Administrator</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    system_admin
                  </span>
                </button>

                {/* Campus Admin Section Header */}
                <div className="pt-1 pb-0.5 flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  <span>Campus Administrators</span>
                </div>

                <button
                  type="button"
                  onClick={() => autofill('admin_diffun', 'diffun123')}
                  className="w-full text-left p-3 rounded-xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 hover:border-sky-500 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-sky-600 transition-colors">admin_diffun</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">Diffun Campus Admin (Main)</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    campus_admin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => autofill('admin_maddela', 'maddela123')}
                  className="w-full text-left p-3 rounded-xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 hover:border-sky-500 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-sky-600 transition-colors">admin_maddela</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">Maddela Campus Admin</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    campus_admin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => autofill('admin_cabarroguis', 'cabarroguis123')}
                  className="w-full text-left p-3 rounded-xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 hover:border-sky-500 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-sky-600 transition-colors">admin_cabarroguis</span>
                    <span className="text-[11px] text-light-text dark:text-dark-muted block">Cabarroguis Campus Admin</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    campus_admin
                  </span>
                </button>"""

content = content.replace(old_accounts_block, new_accounts_block)
file_path.write_text(content, encoding="utf-8")
print("Login page updated with Campus Admin test accounts.")