/**
 * API client para el backend FastAPI.
 * Adjunta automáticamente el Bearer token de Supabase en cada request.
 */
import { supabase } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.detail ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  // Exams
  listExams: () => request<Exam[]>("/exams"),
  getExam: (id: string) => request<Exam>(`/exams/${id}`),
  createExam: (data: CreateExamPayload) =>
    request<Exam>("/exams", { method: "POST", body: JSON.stringify(data) }),
  deleteExam: (id: string) =>
    request<void>(`/exams/${id}`, { method: "DELETE" }),
  startExam: (id: string) =>
    request<Exam>(`/exams/${id}/start`, { method: "POST" }),

  // Questions
  listQuestions: (examId: string, params?: QuestionFilters) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<Question[]>(`/exams/${examId}/questions${qs}`);
  },
  approveQuestion: (id: string) =>
    request<Question>(`/questions/${id}/approve`, { method: "POST" }),
  rejectQuestion: (id: string) =>
    request<Question>(`/questions/${id}/reject`, { method: "POST" }),
  patchQuestion: (id: string, data: Partial<Question>) =>
    request<Question>(`/questions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Exports
  listExports: (examId: string) => request<ExamExport[]>(`/exams/${examId}/exports`),
  triggerExport: (examId: string, format: string) =>
    request<ExamExport>(`/exams/${examId}/exports`, {
      method: "POST",
      body: JSON.stringify({ format }),
    }),
  downloadExport: (exportId: string) =>
    request<{ download_url: string; format: string }>(`/exports/${exportId}/download`),

  // Folders
  listFolders: () => request<Folder[]>("/folders"),
  createFolder: (data: { name: string; description?: string }) =>
    request<Folder>("/folders", { method: "POST", body: JSON.stringify(data) }),

  // Tenant
  getTenant: () => request<Tenant>("/tenants/me"),
  getSubscription: () => request<Subscription>("/tenants/me/subscription"),
  listMembers: () => request<Member[]>("/tenants/me/members"),
  inviteMember: (email: string, role: string) =>
    request<{ message: string }>("/tenants/me/members/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

  // Admin
  getKpis: () => request<AdminKpis>("/admin/kpis"),
  listAdminTenants: (params?: { search?: string; status?: string }) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return request<AdminTenant[]>(`/admin/tenants${qs}`);
  },
  updateAdminTenant: (id: string, data: { status?: string; plan_id?: string }) =>
    request<AdminTenant>(`/admin/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  listPlans: () => request<Plan[]>("/admin/plans"),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Exam {
  id: string;
  name: string;
  description?: string;
  status: string;
  total_questions: number;
  duration_minutes: number;
  quality_score?: number;
  pipeline_log_json: PipelineStep[];
  created_at: string;
  folder_id: string;
  blueprint_id: string;
}

export interface PipelineStep {
  step: string;
  status: "ok" | "error";
  ts: string;
  error?: string;
}

export interface Question {
  id: string;
  exam_id: string;
  bank_only: boolean;
  type: string;
  stem: string;
  alternatives_json: string[];
  correct_answers_json: string[];
  justification: string;
  difficulty: string;
  bloom_level: string;
  objective: string;
  quality_score?: number;
  quality_issues: string[];
  position?: number;
  approved?: boolean;
}

export interface ExamExport {
  id: string;
  exam_id: string;
  format: string;
  file_path: string;
  file_size?: number;
  download_url?: string;
  created_at: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id?: string;
}

export interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  trial_ends_at?: string;
  ends_at?: string;
  days_remaining?: number;
}

export interface Member {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  active: boolean;
}

export interface AdminKpis {
  total_tenants: number;
  exams_today: number;
  exams_this_month: number;
  llm_cost_month: number;
  top_tenants: { tenant_id: string; tenant_name: string; cost: number }[];
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_id?: string;
  plan_name?: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price_usd: number;
  is_active: boolean;
}

export interface CreateExamPayload {
  name: string;
  blueprint_id: string;
  folder_id: string;
  description?: string;
}

export interface QuestionFilters {
  bank_only?: string;
  difficulty?: string;
  bloom_level?: string;
  approved?: string;
}
