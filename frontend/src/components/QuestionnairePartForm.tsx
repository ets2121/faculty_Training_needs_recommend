'use client';

import React, { useState, useEffect } from 'react';
import { Save, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface QuestionnairePartFormProps {
  partNumber: number;
  label: string;
  initialData?: any;
  onSavePart: (partNumber: number, data: any) => Promise<void>;
  onNextPart?: () => void;
  onPrevPart?: () => void;
}

export default function QuestionnairePartForm({
  partNumber,
  label,
  initialData,
  onSavePart,
  onNextPart,
  onPrevPart,
}: QuestionnairePartFormProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setFormData(initialData || getDefaultData(partNumber));
  }, [partNumber, initialData]);

  function getDefaultData(part: number) {
    switch (part) {
      case 1:
        return { department: 'BSIT', age: 35, sex: 'Female', employment_status: 'Permanent' };
      case 2:
        return { highest_educational_attainment: "Master's Degree", field_of_specialization: 'Computer Science' };
      case 3:
        return { academic_rank: 'Assistant Professor', years_teaching: '5-10 years', administrative_designation: 'None', trainings_last_3_years: '3-5' };
      case 4:
        return { training_areas: ['Instruction', 'Technology Integration'], training_modalities_attended: ['Webinar'] };
      case 5:
        return {
          competency: {
            research_competency: { proficiency: 3, importance: 5 },
            computer_literacy_digital_technologies: { proficiency: 3, importance: 5 },
            outcomes_based_education: { proficiency: 2, importance: 4 },
            student_development: { proficiency: 3, importance: 4 },
          }
        };
      case 6:
        return {
          emerging_training_needs: {
            artificial_intelligence: 5,
            machine_learning: 4,
            data_analytics: 4,
            educational_technology: 5,
            research_methods: 4,
          }
        };
      case 7:
        return { preferred_learning_modality: ['Webinar'], preferred_schedule: ['Saturdays'], preferred_duration: ['Two days'] };
      case 8:
        return { barriers: { heavy_teaching_workload: 4, time_constraints: 3, lack_of_budget: 2 } };
      default:
        return {};
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSavePart(partNumber, formData);
      showToast('success', `Part ${partNumber} Saved`, `${label} data has been saved successfully.`);
      if (onNextPart) onNextPart();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save part data.';
      showToast('error', 'Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between gap-3 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded border border-brand-gold/20">
            Part {partNumber} of 8
          </span>
          <h2 className="text-lg font-bold text-light-text dark:text-white mt-1">{label}</h2>
        </div>

        {partNumber in { 1: 1, 2: 1, 3: 1, 5: 1, 6: 1 } && (
          <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full border border-brand-green/20">
            Required for ML Recommendation
          </span>
        )}
      </div>

      {/* Part 1: Personal Profile */}
      {partNumber === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Department</label>
            <select
              value={formData.department || 'BSIT'}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              {['BSIT', 'BSED', 'BSCE', 'BEED', 'BSBA', 'BSCS', 'BAELS', 'BSMATH', 'BSHM', 'BSMidwifery'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Age</label>
            <input
              type="number"
              min={18}
              max={80}
              value={formData.age || 35}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 35 })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Sex</label>
            <select
              value={formData.sex || 'Female'}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Employment Status</label>
            <select
              value={formData.employment_status || 'Permanent'}
              onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Permanent">Permanent / Regular</option>
              <option value="Temporary">Temporary</option>
              <option value="Contractual">Contractual</option>
            </select>
          </div>
        </div>
      )}

      {/* Part 2: Educational Background */}
      {partNumber === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Highest Degree</label>
            <select
              value={formData.highest_educational_attainment || "Master's Degree"}
              onChange={(e) => setFormData({ ...formData, highest_educational_attainment: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Bachelor's Degree">Bachelor's Degree</option>
              <option value="Master's Degree">Master's Degree</option>
              <option value="Doctoral Degree">Doctoral Degree</option>
              <option value="Post-Doctoral">Post-Doctoral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Field of Specialization</label>
            <input
              type="text"
              value={formData.field_of_specialization || 'Computer Science'}
              onChange={(e) => setFormData({ ...formData, field_of_specialization: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Part 3: Professional Background */}
      {partNumber === 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Academic Rank</label>
            <select
              value={formData.academic_rank || 'Assistant Professor'}
              onChange={(e) => setFormData({ ...formData, academic_rank: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="Instructor I">Instructor I</option>
              <option value="Instructor II">Instructor II</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Professor">Professor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Years Teaching</label>
            <select
              value={formData.years_teaching || '5-10 years'}
              onChange={(e) => setFormData({ ...formData, years_teaching: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="1-4 years">1-4 years</option>
              <option value="5-10 years">5-10 years</option>
              <option value="11-15 years">11-15 years</option>
              <option value="15+ years">15+ years</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Administrative Designation</label>
            <input
              type="text"
              value={formData.administrative_designation || 'None'}
              onChange={(e) => setFormData({ ...formData, administrative_designation: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">Trainings Attended (Last 3 Years)</label>
            <select
              value={formData.trainings_last_3_years || '3-5'}
              onChange={(e) => setFormData({ ...formData, trainings_last_3_years: e.target.value })}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="0">0 (None)</option>
              <option value="1-2">1-2</option>
              <option value="3-5">3-5</option>
              <option value="5+">5+</option>
            </select>
          </div>
        </div>
      )}

      {/* Part 4: Training History */}
      {partNumber === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-2">Training Areas Previously Attended</label>
            <div className="grid grid-cols-2 gap-2">
              {['Instruction', 'Research', 'Technology Integration', 'Community Extension', 'Leadership'].map((area) => {
                const currentAreas = formData.training_areas || [];
                const checked = currentAreas.includes(area);
                return (
                  <label key={area} className="flex items-center gap-2 p-2.5 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-xs text-light-text dark:text-dark-text cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...currentAreas, area]
                          : currentAreas.filter((a: string) => a !== area);
                        setFormData({ ...formData, training_areas: updated });
                      }}
                      className="rounded border-light-border dark:border-dark-border text-brand-green focus:ring-emerald-500"
                    />
                    <span>{area}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Part 5: Competency Assessment */}
      {partNumber === 5 && (
        <div className="space-y-4">
          <p className="text-xs text-light-text dark:text-dark-muted">Rate your current proficiency (1=Low, 5=High) and perceived importance (1=Low, 5=High):</p>
          {[
            { key: 'research_competency', label: 'Research & Publication Writing' },
            { key: 'computer_literacy_digital_technologies', label: 'Computer Literacy & Digital Technologies' },
            { key: 'outcomes_based_education', label: 'Outcomes-Based Education (OBE)' },
            { key: 'student_development', label: 'Student Mentorship & Guidance' },
          ].map((item) => {
            const compData = formData.competency?.[item.key] || { proficiency: 3, importance: 5 };
            return (
              <div key={item.key} className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/60 space-y-3">
                <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">{item.label}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-light-text dark:text-dark-muted block mb-1">Proficiency: <strong className="text-light-text dark:text-white">{compData.proficiency} / 5</strong></span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={compData.proficiency}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFormData({
                          ...formData,
                          competency: {
                            ...formData.competency,
                            [item.key]: { ...compData, proficiency: val }
                          }
                        });
                      }}
                      className="w-full accent-brand-green"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-light-text dark:text-dark-muted block mb-1">Importance: <strong className="text-brand-gold">{compData.importance} / 5</strong></span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={compData.importance}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setFormData({
                          ...formData,
                          competency: {
                            ...formData.competency,
                            [item.key]: { ...compData, importance: val }
                          }
                        });
                      }}
                      className="w-full accent-brand-gold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Part 6: Emerging Training Needs */}
      {partNumber === 6 && (
        <div className="space-y-3">
          <p className="text-xs text-light-text dark:text-dark-muted">Rate your interest/urgency for the following training topics (1=Not Needed, 5=High Need):</p>
          {[
            { key: 'artificial_intelligence', label: 'Artificial Intelligence in Education' },
            { key: 'machine_learning', label: 'Machine Learning & Data Science' },
            { key: 'data_analytics', label: 'Data Analytics & Visualization' },
            { key: 'educational_technology', label: 'Educational Technology & LMS' },
            { key: 'research_methods', label: 'Advanced Research Methods & Grant Writing' },
          ].map((item) => {
            const needVal = formData.emerging_training_needs?.[item.key] || 4;
            return (
              <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/60 gap-4">
                <span className="text-xs font-semibold text-light-text dark:text-dark-text">{item.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={needVal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        emerging_training_needs: {
                          ...formData.emerging_training_needs,
                          [item.key]: val
                        }
                      });
                    }}
                    className="w-28 sm:w-40 accent-brand-green"
                  />
                  <span className="text-xs font-mono font-bold text-light-text dark:text-white w-6 text-right">{needVal}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Part 7: Learning Preferences */}
      {partNumber === 7 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-2">Preferred Modality</label>
            {['Webinar', 'Blended Learning', 'Face-to-Face', 'Online Self-Paced'].map((mod) => (
              <label key={mod} className="flex items-center gap-2 mb-2 text-xs text-light-text dark:text-dark-text">
                <input
                  type="checkbox"
                  checked={(formData.preferred_learning_modality || []).includes(mod)}
                  onChange={(e) => {
                    const current = formData.preferred_learning_modality || [];
                    const updated = e.target.checked ? [...current, mod] : current.filter((m: string) => m !== mod);
                    setFormData({ ...formData, preferred_learning_modality: updated });
                  }}
                  className="rounded border-light-border dark:border-dark-border text-brand-green"
                />
                <span>{mod}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-2">Preferred Schedule</label>
            {['Saturdays', 'Weekdays', 'Sundays'].map((sched) => (
              <label key={sched} className="flex items-center gap-2 mb-2 text-xs text-light-text dark:text-dark-text">
                <input
                  type="checkbox"
                  checked={(formData.preferred_schedule || []).includes(sched)}
                  onChange={(e) => {
                    const current = formData.preferred_schedule || [];
                    const updated = e.target.checked ? [...current, sched] : current.filter((s: string) => s !== sched);
                    setFormData({ ...formData, preferred_schedule: updated });
                  }}
                  className="rounded border-light-border dark:border-dark-border text-brand-green"
                />
                <span>{sched}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-2">Preferred Duration</label>
            {['One day', 'Two days', 'Three days', 'One week'].map((dur) => (
              <label key={dur} className="flex items-center gap-2 mb-2 text-xs text-light-text dark:text-dark-text">
                <input
                  type="checkbox"
                  checked={(formData.preferred_duration || []).includes(dur)}
                  onChange={(e) => {
                    const current = formData.preferred_duration || [];
                    const updated = e.target.checked ? [...current, dur] : current.filter((d: string) => d !== dur);
                    setFormData({ ...formData, preferred_duration: updated });
                  }}
                  className="rounded border-light-border dark:border-dark-border text-brand-green"
                />
                <span>{dur}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Part 8: Barriers to Training */}
      {partNumber === 8 && (
        <div className="space-y-3">
          <p className="text-xs text-light-text dark:text-dark-muted">Rate the impact of these barriers on your training participation (1=Low Impact, 5=Severe Barrier):</p>
          {[
            { key: 'heavy_teaching_workload', label: 'Heavy Teaching Workload' },
            { key: 'time_constraints', label: 'Time Constraints' },
            { key: 'lack_of_budget', label: 'Lack of Funding / Budget' },
            { key: 'internet_connectivity', label: 'Internet Connectivity Issues' },
          ].map((item) => {
            const bVal = formData.barriers?.[item.key] || 3;
            return (
              <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/60 gap-4">
                <span className="text-xs font-semibold text-light-text dark:text-dark-text">{item.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={bVal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({
                        ...formData,
                        barriers: { ...formData.barriers, [item.key]: val }
                      });
                    }}
                    className="w-28 sm:w-40 accent-brand-gold"
                  />
                  <span className="text-xs font-mono font-bold text-brand-gold w-6 text-right">{bVal}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Action Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
        {onPrevPart && partNumber > 1 ? (
          <button
            type="button"
            onClick={onPrevPart}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:text-white hover:border-light-border dark:border-dark-border text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Part</span>
          </button>
        ) : <div />}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
