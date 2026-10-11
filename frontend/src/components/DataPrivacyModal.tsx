'use client';

import React, { useEffect } from 'react';
import {
  ShieldCheck,
  X,
  FileText,
  Lock,
  UserCheck,
  Eye,
  AlertCircle,
  Building,
  Scale,
  CheckCircle2,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface DataPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function DataPrivacyModal({
  isOpen,
  onClose,
  onAccept,
}: DataPrivacyModalProps) {
  // Prevent background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border shadow-2xl overflow-hidden">
        {/* Header with QSU branding & RA 10173 notice */}
        <div className="px-6 py-5 border-b border-light-border dark:border-dark-border bg-brand-green/5 dark:bg-brand-green/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-brand-green flex items-center justify-center shadow-md shadow-brand-green/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green dark:text-emerald-400 border border-brand-green/30">
                  Republic Act No. 10173
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold-dark dark:text-brand-gold border border-brand-gold/30">
                  National Privacy Commission Compliant
                </span>
              </div>
              <h2
                id="privacy-policy-title"
                className="text-base sm:text-lg font-extrabold text-light-text dark:text-white mt-1 leading-snug"
              >
                Quirino State University Data Privacy Policy & Consent Agreement
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Data Privacy Modal"
            className="p-2 rounded-xl text-light-text dark:text-dark-muted hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Privacy Policy Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs text-light-secondary dark:text-dark-secondary leading-relaxed">
          {/* Institutional Statement */}
          <div className="p-4 rounded-2xl bg-brand-green/5 border border-brand-green/20 text-light-text dark:text-white space-y-2">
            <div className="flex items-center gap-2 text-brand-green dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Building className="w-4 h-4 shrink-0" />
              <span>Institutional Statement of Privacy Commitment</span>
            </div>
            <p className="text-[11px] leading-relaxed text-light-secondary dark:text-dark-secondary">
              Quirino State University (QSU) recognizes its responsibilities under the{' '}
              <strong className="text-light-text dark:text-white font-semibold">
                Philippine Data Privacy Act of 2012 (Republic Act No. 10173)
              </strong>
              , its Implementing Rules and Regulations (IRR), and all applicable circulars issued by the National
              Privacy Commission (NPC). This Policy applies to all faculty members, department chairs, academic
              deans, and university administrators accessing the QSU Faculty Training Needs Recommender System across
              the <strong className="text-light-text dark:text-white font-semibold">Diffun (Main)</strong>,{' '}
              <strong className="text-light-text dark:text-white font-semibold">Maddela</strong>, and{' '}
              <strong className="text-light-text dark:text-white font-semibold">Cabarroguis</strong> campuses.
            </p>
          </div>

          {/* Section 1: Purpose of Processing */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-light-text dark:text-white font-bold text-sm">
              <FileText className="w-4 h-4 text-brand-green" />
              <span>1. Purpose of Data Collection & Processing</span>
            </div>
            <p>
              Your personal and professional assessment data is gathered strictly for legitimate institutional
              development purposes, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px]">
              <li>
                Conducting objective competency gap assessments across Core, Functional, and Leadership domains.
              </li>
              <li>
                Generating personalized, machine-learning-ranked faculty training recommendations and development plans.
              </li>
              <li>
                Assisting Department Chairs and Campus Directors in data-driven training priority synthesis and budget
                allocation.
              </li>
              <li>
                Maintaining verifiable institutional accreditation metrics and professional capability reporting.
              </li>
            </ul>
          </section>

          {/* Section 2: Categories of Data Collected */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-light-text dark:text-white font-bold text-sm">
              <UserCheck className="w-4 h-4 text-brand-gold" />
              <span>2. Categories of Personal & Assessment Data Collected</span>
            </div>
            <p>
              Under this system, the university collects and processes the following structured data points:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-light-border dark:border-dark-border bg-light-muted-surface dark:bg-dark-card-elevated">
                <span className="font-bold text-light-text dark:text-white block mb-1">
                  A. Profile & Academic Credentials
                </span>
                <p className="text-[11px]">
                  Full name, employee/faculty code, institutional email, department, campus, employment status,
                  academic rank, highest educational attainment, and years of teaching service.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-light-border dark:border-dark-border bg-light-muted-surface dark:bg-dark-card-elevated">
                <span className="font-bold text-light-text dark:text-white block mb-1">
                  B. Competency & Training Inputs
                </span>
                <p className="text-[11px]">
                  Self-assessment proficiency ratings (1–5) and importance scores (1–5), historical seminars attended,
                  ratings in emerging technology needs, preferred delivery modalities, schedules, and training barriers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Data Security and Confidentiality */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-light-text dark:text-white font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>3. Data Security, Anonymization & Confidentiality</span>
            </div>
            <p>
              To safeguard your data against accidental loss, unauthorized access, and unlawful processing, QSU implements
              the following technical and organizational measures:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px]">
              <li>
                <strong className="text-light-text dark:text-white">Strict Multi-Campus RBAC Isolation:</strong> Campus
                and Department administrators can only access records strictly under their jurisdiction. Individual faculty
                records are strictly restricted to the user and their designated department chair.
              </li>
              <li>
                <strong className="text-light-text dark:text-white">Session Protection & Password Hashing:</strong>{' '}
                Industry-standard Bcrypt salted password hashing and encrypted JSON Web Tokens (JWT) for session
                authentication.
              </li>
              <li>
                <strong className="text-light-text dark:text-white">Anonymized Machine Learning Inference:</strong> Model
                training data utilizes internal surrogate identification numbers. Personal demographic identifying markers
                are strictly stripped prior to training model artifacts.
              </li>
              <li>
                <strong className="text-light-text dark:text-white">Immutable Audit Logging:</strong> All administrative
                data access, user modifications, password resets, and recommendation requests are permanently logged with
                actor ID, action description, timestamp, and IP address.
              </li>
            </ul>
          </section>

          {/* Section 4: Your Rights as a Data Subject */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-light-text dark:text-white font-bold text-sm">
              <Scale className="w-4 h-4 text-brand-green" />
              <span>4. Rights of the Data Subject under R.A. No. 10173</span>
            </div>
            <p>
              As a faculty member or system user, you are entitled to the full protection of your rights under the
              Philippine Data Privacy Act:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg border border-light-border dark:border-dark-border">
                <strong className="text-light-text dark:text-white">1. Right to be Informed:</strong> Know how your
                assessment data is collected, stored, and evaluated.
              </div>
              <div className="p-2.5 rounded-lg border border-light-border dark:border-dark-border">
                <strong className="text-light-text dark:text-white">2. Right to Access:</strong> View and review your
                recorded questionnaire responses and generated recommendation history anytime.
              </div>
              <div className="p-2.5 rounded-lg border border-light-border dark:border-dark-border">
                <strong className="text-light-text dark:text-white">3. Right to Rectification:</strong> Request
                correction or updating of inaccurate profile or academic credentials through your faculty profile or
                department chair.
              </div>
              <div className="p-2.5 rounded-lg border border-light-border dark:border-dark-border">
                <strong className="text-light-text dark:text-white">4. Right to File a Complaint:</strong> Seek recourse
                with the university Data Protection Officer or the National Privacy Commission (NPC) for any privacy
                concerns.
              </div>
            </div>
          </section>

          {/* Section 5: Data Retention & Disposal */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-light-text dark:text-white font-bold text-sm">
              <Eye className="w-4 h-4 text-sky-500" />
              <span>5. Data Retention & Archival Policy</span>
            </div>
            <p className="text-[11px]">
              Your competency assessments and recommendation histories are retained for the duration of your active academic
              service at Quirino State University. In case of separation from service, records are archived or anonymized in
              compliance with Commission on Higher Education (CHED) records management protocols and National Archives of
              the Philippines regulations.
            </p>
          </section>

          {/* Section 6: Contact & Inquiries */}
          <div className="p-3.5 rounded-xl border border-light-border dark:border-dark-border bg-light-muted-surface dark:bg-dark-card-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
            <div>
              <span className="font-bold text-light-text dark:text-white block">
                QSU Data Protection Officer (DPO) Contact
              </span>
              <span>
                Office of Information and Communications Technology • Quirino State University, Diffun, Quirino
              </span>
            </div>
            <a
              href="mailto:dpo@qsu.edu.ph"
              className="inline-flex items-center gap-1.5 text-brand-green hover:underline font-semibold shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>dpo@qsu.edu.ph</span>
            </a>
          </div>

          {/* Section 7: Formal Consent Declaration */}
          <div className="p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 text-light-text dark:text-white space-y-1.5">
            <div className="flex items-center gap-2 text-brand-gold-dark dark:text-brand-gold font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Formal Consent Declaration</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              By checking the consent box and signing into this platform, you freely, voluntarily, and expressly grant your
              consent to Quirino State University to process your personal and competency data for the aforementioned
              training needs assessment, machine learning modeling, and faculty development recommendation purposes, in
              accordance with the Philippine Data Privacy Act of 2012 and this Privacy Policy.
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-light-text dark:text-dark-muted font-medium text-center sm:text-left">
            Last updated: October 2026 • Effective University-wide (All Campuses)
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border text-light-text dark:text-white text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Understand &amp; Agree</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
