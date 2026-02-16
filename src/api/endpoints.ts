import api from './axios';
import type {
  LoginRequest,
  LoginResponse,
  DashboardOverview,
  Renderer,
  ApproveRendererRequest,
  RejectRendererRequest,
  Service,
  ServiceType,
  Tool,
  CreateToolRequest,
  UpdateToolRequest,
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
  getPending: () =>
    api.get<ApiResponse<Renderer[]>>('/admin/renderers/pending'),
  approve: (userId: string, data: ApproveRendererRequest) =>
    api.post<ApiResponse<Renderer>>(`/admin/renderers/${userId}/approve`, data),
  reject: (userId: string, data: RejectRendererRequest) =>
    api.post<ApiResponse<Renderer>>(`/admin/renderers/${userId}/reject`, data),
};

// Services
export const servicesApi = {
  getAll: () =>
    api.get<ApiResponse<Service[]>>('/admin/services'),
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
  getAll: () =>
    api.get<ApiResponse<ServiceType[]>>('/service-types'),
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
  getAll: () =>
    api.get<ApiResponse<Tool[]>>('/admin/tools'),
  create: (data: CreateToolRequest) =>
    api.post<ApiResponse<Tool>>('/admin/tools', data),
  update: (toolId: string, data: UpdateToolRequest) =>
    api.put<ApiResponse<Tool>>(`/admin/tools/${toolId}`, data),
  delete: (toolId: string) =>
    api.delete<ApiResponse<void>>(`/admin/tools/${toolId}`),
};
