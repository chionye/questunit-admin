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
  ApiResponse,
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
  getPending: (params?: { page?: number; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
    const query = new URLSearchParams(p).toString();
    return api.get<ApiResponse<Renderer[]>>(`/admin/renderers/pending${query ? `?${query}` : ''}`);
  },
  approve: (userId: string, data: ApproveRendererRequest) =>
    api.post<ApiResponse<Renderer>>(`/admin/renderers/${userId}/approve`, data),
  reject: (userId: string, data: RejectRendererRequest) =>
    api.post<ApiResponse<Renderer>>(`/admin/renderers/${userId}/reject`, data),
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
  getAll: (params?: { page?: number; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params?.page) p.page = String(params.page);
    if (params?.limit) p.limit = String(params.limit);
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
    return api.get<ApiResponse<ServiceType[]>>(`/service-types${query ? `?${query}` : ''}`);
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
