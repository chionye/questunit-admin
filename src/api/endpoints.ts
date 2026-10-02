import api from './axios';
import type {
  LoginRequest,
  LoginResponse,
  DashboardOverview,
  Renderer,
  ApproveRendererRequest,
  RejectRendererRequest,
  RequesterUser,
  Service,
  ServiceType,
  Tool,
  CreateToolRequest,
  UpdateToolRequest,
  Program,
  CreateProgramRequest,
  UpdateProgramRequest,
  ProgramStage,
  CreateStageRequest,
  UpdateStageRequest,
  ProgramVideo,
  CreateVideoRequest,
  UpdateVideoRequest,
  ServiceTypeVideo,
  CreateServiceTypeVideoRequest,
  UpdateServiceTypeVideoRequest,
  UserReport,
  UpdateReportStatusRequest,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  EmailRecipient,
  SendEmailRequest,
  SendBulkEmailRequest,
  SendEmailResult,
  BulkSendResult,
  ApiResponse,
  AppVersion,
  CreateAppVersionRequest,
  UpdateAppVersionRequest,
} from '../types';

// Auth
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data),
};

// Dashboard
export const dashboardApi = {
  getOverview: () =>
    api.get<ApiResponse<DashboardOverview>>('/admin/dashboard'),
};

// Renderers
export const renderersApi = {
  getPending: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.search) p.search = params.search;
    if (params?.status) p.status = params.status;
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<Renderer[]>>(`/admin/renderers/pending${query ? `?${query}` : ''}`);
  },
  approve: (userId: string, data: ApproveRendererRequest) =>
    api.post<ApiResponse<Renderer>>(`/admin/renderers/${userId}/approve`, data),
  reject: (userId: string, data: RejectRendererRequest) =>
    api.post<ApiResponse<Renderer>>(`/admin/renderers/${userId}/reject`, data),
  updateUserServiceStatus: (userServiceId: string | number, data: { approvalStatus: 'approved' | 'rejected'; reason?: string }) =>
    api.patch<ApiResponse<unknown>>(`/admin/user-services/${userServiceId}/status`, data),
  updateUserServiceType: (userServiceId: string | number, serviceTypeId: number) =>
    api.patch<ApiResponse<unknown>>(`/admin/user-services/${userServiceId}/service-type`, { serviceTypeId }),
};

// Requesters
export const requestersApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const p: Record<string, string> = { role: 'requester' };
    if (params?.status) p.status = params.status;
    if (params?.search) p.search = params.search;
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    return api.get<ApiResponse<RequesterUser[]>>(`/admin/users?${new URLSearchParams(p).toString()}`);
  },
  getById: (userId: string) =>
    api.get<ApiResponse<RequesterUser>>(`/admin/users/${userId}`),
  updateStatus: (userId: string, status: string, reason?: string) =>
    api.put<ApiResponse<{ userId: number; status: string }>>(`/admin/users/${userId}/status`, { status, reason }),
};

// Services
export const servicesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.search) p.search = params.search;
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<Service[]>>(`/admin/services${query ? `?${query}` : ''}`);
  },
  create: (data: FormData) =>
    api.post<ApiResponse<Service>>('/admin/services', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (serviceId: string, data: FormData) =>
    api.put<ApiResponse<Service>>(`/admin/services/${serviceId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (serviceId: string) =>
    api.delete<ApiResponse<void>>(`/admin/services/${serviceId}`),
};

// Service Types
export const serviceTypesApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<ServiceType[]>>(`/admin/service-types${query ? `?${query}` : ''}`);
  },
  create: (data: FormData) =>
    api.post<ApiResponse<ServiceType>>('/admin/service-types', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (typeId: string, data: FormData) =>
    api.put<ApiResponse<ServiceType>>(`/admin/service-types/${typeId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (typeId: string) =>
    api.delete<ApiResponse<void>>(`/admin/service-types/${typeId}`),
};

// Tools
export const toolsApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<Tool[]>>(`/admin/tools${query ? `?${query}` : ''}`);
  },
  create: (data: CreateToolRequest) =>
    api.post<ApiResponse<Tool>>('/admin/tools', data),
  update: (toolId: string, data: UpdateToolRequest) =>
    api.put<ApiResponse<Tool>>(`/admin/tools/${toolId}`, data),
  delete: (toolId: string) =>
    api.delete<ApiResponse<void>>(`/admin/tools/${toolId}`),
};

// Programs
export const programsApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<Program[]>>(`/admin/programs${query ? `?${query}` : ''}`);
  },
  create: (data: CreateProgramRequest) =>
    api.post<ApiResponse<Program>>('/admin/programs', data),
  update: (id: number, data: UpdateProgramRequest) =>
    api.put<ApiResponse<Program>>(`/admin/programs/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/programs/${id}`),
};

// Stages
export const stagesApi = {
  getByProgram: (programId: number) =>
    api.get<ApiResponse<ProgramStage[]>>(`/admin/programs/${programId}/stages`),
  create: (data: CreateStageRequest) =>
    api.post<ApiResponse<ProgramStage>>('/admin/stages', data),
  update: (id: number, data: UpdateStageRequest) =>
    api.put<ApiResponse<ProgramStage>>(`/admin/stages/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/stages/${id}`),
};

// Videos
export const videosApi = {
  getByStage: (stageId: number) =>
    api.get<ApiResponse<ProgramVideo[]>>(`/admin/stages/${stageId}/videos`),
  create: (data: CreateVideoRequest) =>
    api.post<ApiResponse<ProgramVideo>>('/admin/videos', data),
  update: (id: number, data: UpdateVideoRequest) =>
    api.put<ApiResponse<ProgramVideo>>(`/admin/videos/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/videos/${id}`),
};

// Service Type Videos
export const serviceTypeVideosApi = {
  getAll: () =>
    api.get<ApiResponse<ServiceTypeVideo[]>>('/admin/service-type-videos'),
  create: (data: CreateServiceTypeVideoRequest) =>
    api.post<ApiResponse<ServiceTypeVideo>>('/admin/service-type-videos', data),
  update: (id: number, data: UpdateServiceTypeVideoRequest) =>
    api.put<ApiResponse<ServiceTypeVideo>>(`/admin/service-type-videos/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/service-type-videos/${id}`),
};

// Verification Calls
export const verificationCallsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.status) p.status = params.status;
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<any[]>>(`/admin/verification-calls${query ? `?${query}` : ''}`);
  },
  updateStatus: (userId: string, status: string) =>
    api.put<ApiResponse<any>>(`/admin/verification-calls/${userId}/status`, { status }),
};

// Tasks
export const tasksApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.search) p.search = params.search;
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<Task[]>>(`/admin/tasks${query ? `?${query}` : ''}`);
  },
  create: (data: FormData | CreateTaskRequest) => {
    const isFormData = data instanceof FormData;
    return api.post<ApiResponse<Task>>('/admin/tasks', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  update: (id: number, data: FormData | UpdateTaskRequest) => {
    const isFormData = data instanceof FormData;
    return api.put<ApiResponse<Task>>(`/admin/tasks/${id}`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/tasks/${id}`),
};

// User Reports
export const userReportsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.status) p.status = params.status;
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<{ data: UserReport[]; total: number; page: number; totalPages: number }>>(`/admin/user-reports${query ? `?${query}` : ''}`);
  },
  updateStatus: (id: number, data: UpdateReportStatusRequest) =>
    api.put<ApiResponse<UserReport>>(`/admin/user-reports/${id}/status`, data),
};

// Users (admin — all roles)
export const usersApi = {
  getAll: (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params?.role) p.role = params.role;
    if (params?.status) p.status = params.status;
    if (params?.search) p.search = params.search;
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    return api.get<ApiResponse<RequesterUser[]>>(`/admin/users?${new URLSearchParams(p).toString()}`);
  },
  getById: (userId: string) =>
    api.get<ApiResponse<RequesterUser>>(`/admin/users/${userId}`),
  delete: (userId: string) =>
    api.delete<ApiResponse<void>>(`/admin/users/${userId}`),
  getDeleted: (params?: { page?: number; limit?: number; search?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.search) p.search = params.search;
    return api.get<ApiResponse<RequesterUser[]>>(`/admin/users/deleted?${new URLSearchParams(p).toString()}`);
  },
  restore: (userId: string) =>
    api.post<ApiResponse<void>>(`/admin/users/${userId}/restore`),
  restoreAll: () =>
    api.post<ApiResponse<void>>('/admin/users/restore-all'),
  permanentDelete: (userId: string) =>
    api.delete<ApiResponse<void>>(`/admin/users/${userId}/permanent`),
  permanentDeleteAll: () =>
    api.delete<ApiResponse<void>>('/admin/users/deleted'),
  updateProfile: (userId: string, data: {
    firstName?: string; lastName?: string; email?: string; phone?: string;
    role?: string; status?: string; dob?: string; gender?: string;
    city?: string; state?: string; country?: string; bio?: string;
    hourlyRate?: number; skills?: string[]; experience?: string;
  }) =>
    api.put<ApiResponse<RequesterUser>>(`/admin/users/${userId}/profile`, data),
};

// Pending Payments (Withdrawals)
export const adminApi = {
  getPendingWithdrawals: (params?: { page?: number; limit?: number; status?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.status) p.status = params.status;
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<any[]>>(`/admin/withdrawals?${query}`);
  },
  processWithdrawal: (id: number, data: { action: "approve" | "reject"; notes?: string }) =>
    api.post<ApiResponse<any>>(`/admin/withdrawals/${id}/process`, data),
};

// Media Library
export const uploadsApi = {
  getAll: () =>
    api.get<ApiResponse<{ name: string; category: string; size: number; createdAt: string; url: string }[]>>('/admin/uploads'),
};

// Emails
export const emailsApi = {
  getRecipients: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    if (params?.role) p.role = params.role;
    if (params?.status) p.status = params.status;
    if (params?.search) p.search = params.search;
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<EmailRecipient[]>>(`/admin/emails/recipients${query ? `?${query}` : ''}`);
  },
  send: (data: SendEmailRequest) =>
    api.post<ApiResponse<SendEmailResult>>('/admin/emails/send', data),
  sendBulk: (data: SendBulkEmailRequest) =>
    api.post<ApiResponse<BulkSendResult>>('/admin/emails/send-bulk', data),
};

// App Versions
export const appVersionsApi = {
  getAll: () =>
    api.get<ApiResponse<{ data: AppVersion[]; total: number; page: number; totalPages: number }>>('/admin/app-versions'),
  create: (data: CreateAppVersionRequest) =>
    api.post<ApiResponse<AppVersion>>('/admin/app-versions', data),
  update: (id: number, data: UpdateAppVersionRequest) =>
    api.put<ApiResponse<AppVersion>>(`/admin/app-versions/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/admin/app-versions/${id}`),
};
