import api from './axios';
import type {
  LoginRequest,
  LoginResponse,
  DashboardOverview,
  Renderer,
  ApproveRendererRequest,
  RejectRendererRequest,
  Service,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceType,
  CreateServiceTypeRequest,
  UpdateServiceTypeRequest,
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
  create: (data: CreateServiceRequest) =>
    api.post<ApiResponse<Service>>('/admin/services', data),
  update: (serviceId: string, data: UpdateServiceRequest) =>
    api.put<ApiResponse<Service>>(`/admin/services/${serviceId}`, data),
  delete: (serviceId: string) =>
    api.delete<ApiResponse<void>>(`/admin/services/${serviceId}`),
};

// Service Types
export const serviceTypesApi = {
  getAll: () =>
    api.get<ApiResponse<ServiceType[]>>('/admin/service-types'),
  create: (data: CreateServiceTypeRequest) =>
    api.post<ApiResponse<ServiceType>>('/admin/service-types', data),
  update: (typeId: string, data: UpdateServiceTypeRequest) =>
    api.put<ApiResponse<ServiceType>>(`/admin/service-types/${typeId}`, data),
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
