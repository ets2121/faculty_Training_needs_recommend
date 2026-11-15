/**
 * Frontend System Configuration
 *
 * This configuration file serves as the centralized source of truth for the system's identity,
 * branding, institutional details, and metadata across the entire frontend application.
 *
 * To change the system name, abbreviation, tagline, institution, or logos, simply edit the values below
 * or provide corresponding environment variables in your `.env` or `.env.local` file.
 */

export interface SystemConfig {
  /** Full official title of the system */
  name: string;
  /** Short brand name used in navigation bars and compact UI */
  shortName: string;
  /** System abbreviation or acronym */
  abbreviation: string;
  /** Current release version */
  version: string;
  /** Primary tagline displayed under the brand name */
  tagline: string;
  /** Secondary tagline for hero and landing sections */
  subTagline: string;
  /** Concise description for meta tags and hero sections */
  description: string;
  /** Portal title for sign-in and authentication views */
  portalName: string;

  /** Institutional details */
  institution: {
    /** Full name of the university or organization */
    name: string;
    /** Short name or acronym */
    shortName: string;
    /** Managing office or department */
    office: string;
    /** Official university campuses */
    campuses: string[];
    /** Data Protection Officer contact email */
    dpoEmail: string;
    /** IT / System support email */
    supportEmail: string;
  };

  /** Asset paths and visual branding */
  branding: {
    /** Main system logo (displayed in navbar, login, headers) */
    logoPath: string;
    /** Hero watermark / illustration graphic */
    heroPath: string;
    /** Accessible alt text for images */
    logoAlt: string;
    /** Accent badges and display labels */
    badgeText: string;
  };

  /** Metadata defaults for SEO and browser tab titles */
  meta: {
    title: string;
    description: string;
    copyrightText: string;
  };

  /** Legal & Privacy references */
  legal: {
    privacyPolicyTitle: string;
    privacyAct: string;
  };
}

export const systemConfig: SystemConfig = {
  name:
    process.env.NEXT_PUBLIC_SYSTEM_NAME ||
    'Angee Training Needs Recommender System',

  shortName:
    process.env.NEXT_PUBLIC_SYSTEM_SHORT_NAME ||
    'Angee Recommender',

  abbreviation:
    process.env.NEXT_PUBLIC_SYSTEM_ABBREVIATION ||
    'QSU-TRS',

  version:
    process.env.NEXT_PUBLIC_SYSTEM_VERSION ||
    '2.0',

  tagline:
    process.env.NEXT_PUBLIC_SYSTEM_TAGLINE ||
    'Multi-Campus Training Needs Recommender',

  subTagline:
    'angee Faculty Development & Training Program Recommendations',

  description:
    'A research-backed system matching faculty competency assessments and emerging training needs to institutional catalog programs using machine learning.',

  portalName:
    process.env.NEXT_PUBLIC_PORTAL_NAME ||
    'QSU Portal',

  institution: {
    name:
      process.env.NEXT_PUBLIC_INSTITUTION_NAME ||
      'Quirino State University',
    shortName:
      process.env.NEXT_PUBLIC_INSTITUTION_SHORT_NAME ||
      'QSU',
    office:
      'Office of Information and Communications Technology',
    campuses: ['Diffun (Main)', 'Maddela', 'Cabarroguis'],
    dpoEmail: 'dpo@qsu.edu.ph',
    supportEmail: 'support@qsu.edu.ph',
  },

  branding: {
    logoPath: '/images/logo.png',
    heroPath: '/images/hero-2.png',
    logoAlt:
      process.env.NEXT_PUBLIC_SYSTEM_SHORT_NAME ||
      'Angee Recommender',
    badgeText: 'AI-Driven Institutional Decision Support System',
  },

  meta: {
    title:
      process.env.NEXT_PUBLIC_SYSTEM_NAME ||
      'Angee Training Needs Recommender System',
    description:
      'Production-ready recommendation portal with MySQL, RBAC, and scikit-learn ML engine.',
    copyrightText: 'Quirino State University. All rights reserved.',
  },

  legal: {
    privacyPolicyTitle:
      'Quirino State University Data Privacy Policy & Consent Agreement',
    privacyAct:
      'Philippine Data Privacy Act of 2012 (Republic Act No. 10173)',
  },
};

// Convenience Named Exports for Quick Access
export const SYSTEM_NAME = systemConfig.name;
export const SYSTEM_SHORT_NAME = systemConfig.shortName;
export const SYSTEM_VERSION = systemConfig.version;
export const SYSTEM_TAGLINE = systemConfig.tagline;
export const INSTITUTION_NAME = systemConfig.institution.name;
export const INSTITUTION_SHORT_NAME = systemConfig.institution.shortName;

export default systemConfig;
