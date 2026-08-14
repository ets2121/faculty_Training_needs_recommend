// QSU Faculty Training Recommender — Frontend TypeScript Definitions

export type RoleName = 'faculty' | 'department_admin' | 'system_admin';

export type QuestionnaireStatus = 'not_started' | 'in_progress' | 'eligible' | 'has_recommendation';

export interface DepartmentInfo {
  id: number;
  code: string;
  name: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
  role: RoleName;
  department: DepartmentInfo | null;
  status: string;
}

export interface FacultyProfile {
  faculty_id: number;
  faculty_code: string | null;
  academic_rank: string | null;
  highest_degree: string | null;
  specialization: string | null;
  department: {
    code: string | null;
    name: string | null;
  };
}

export interface PartStatus {
  part_number: number;
  label: string;
  required_for_recommendation: boolean;
  status: 'complete' | 'in_progress' | 'not_started';
  updated_at: string | null;
}

export interface QuestionnaireProgress {
  faculty_id: number;
  questionnaire_status: QuestionnaireStatus;
  last_recommendation_at: string | null;
  eligible_for_recommendation: boolean;
  required_parts_completed: string;
  total_parts_completed: string;
  parts: PartStatus[];
}

export interface FullProfileResponse {
  user: {
    id: number;
    username: string;
    email: string | null;
    full_name: string | null;
    status: string;
  };
  faculty_profile: FacultyProfile;
  questionnaire_progress: {
    questionnaire_status: QuestionnaireStatus;
    eligible_for_recommendation: boolean;
    has_existing_recommendation: boolean;
    last_recommendation_at: string | null;
    required_parts_completed: string;
    total_parts_completed: string;
    parts_status: Record<string, string>;
  };
}

export interface CategoryPrediction {
  training_category: string;
  probability: number;
  rank: number;
}

export interface CatalogRecommendationItem {
  training_id: string;
  title: string;
  category: string;
  match_score: number;
  reason: string;
  description?: string;
}

export interface RecommendationResult {
  status: string;
  model: {
    status: string;
    version: string;
  };
  prediction: {
    top_predictions: CategoryPrediction[];
    all_predictions: Array<{ training_category: string; probability: number }>;
  };
  recommendations: CatalogRecommendationItem[];
  _test_mode?: boolean;
}

export interface DepartmentCategoryPrediction {
  training_category: string;
  department_score: number;
  faculty_coverage: number;
  rank: number;
}

export interface DepartmentRecommendationResult {
  status: string;
  department: string;
  department_name?: string;
  total_faculty_in_dept?: number;
  eligible_faculty_count?: number;
  skipped_faculty?: Array<{ faculty_id: number; questionnaire_status: string }>;
  individual_results_stored?: number;
  model: {
    status: string;
    version: string;
  };
  faculty_count: number;
  prediction: {
    top_categories: DepartmentCategoryPrediction[];
  };
  recommendations: CatalogRecommendationItem[];
  _test_mode?: boolean;
}

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  username: string | null;
  role_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values_json: string | null;
  new_values_json: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface UserListItem {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
  role: RoleName;
  department_code: string | null;
  department_name: string | null;
  status: string;
  account_status?: string | null;
  academic_rank?: string | null;
  highest_degree?: string | null;
  specialization?: string | null;
  faculty_code?: string | null;
  created_at?: string | null;
  last_login_at?: string | null;
}

export interface CatalogItem {
  training_id: string;
  title: string;
  description: string;
  categories: string[];
  target_competencies: string[];
  modalities: string[];
  durations: string[];
  schedules: string[];
  status: string;
}
