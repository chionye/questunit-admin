/** @format */

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  data?: {
    token?: string;
    accessToken?: string;
    user?: User;
  };
  user?: User;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

// Dashboard types
export interface DashboardCounts {
  totalUsers: number;
  totalRequesters: number;
  totalRenderers: number;
  pendingRenderers: number;
  activeServices: number;
  activeTools: number;
}

export interface RecentUser {
  id: number;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  UserProfile: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface RecentService {
  id: number;
  name: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface DashboardOverview {
  counts: DashboardCounts;
  recentActivities: {
    users: RecentUser[];
    services: RecentService[];
  };
}

// Renderer types
export interface Renderer {
  id: string;
  userId?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  documents?: Record<string, unknown>;
  skills?: string[];
  experience?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ApproveRendererRequest {
  notes?: string;
  hourlyRate?: number;
  availability?: Record<string, string[]>;
}

export interface RejectRendererRequest {
  reason: string;
  notes?: string;
}

// Service types
export interface Service {
  id: number;
  _id?: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  category?: string;
  basePrice?: string;
  currency?: string;
  estimatedDuration?: number | null;
  requirements?: Record<string, unknown> | null;
  safetyGuidelines?: string | null;
  isActive?: boolean;
  commissionPercentage?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  ServiceTypes?: ServiceType[];
  [key: string]: unknown;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
  commissionPercentage?: number;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
  commissionPercentage?: number;
}

// Service Type types
export interface ServiceType {
  id: string;
  _id?: string;
  serviceId?: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  basePrice?: number;
  estimatedDuration?: number;
  requestFee?: number | null;
  waitTime?: number | null;
  perKmMorning?: number | null;
  perKmNight?: number | null;
  cancellationFee?: number | null;
  serviceCharge?: number | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateServiceTypeRequest {
  serviceId: string;
  name: string;
  description?: string;
  basePrice?: number;
  estimatedDuration?: number;
  requestFee?: number;
  waitTime?: number;
  perKmMorning?: number;
  perKmNight?: number;
  cancellationFee?: number;
  serviceCharge?: number;
}

export interface UpdateServiceTypeRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  estimatedDuration?: number;
  requestFee?: number;
  waitTime?: number;
  perKmMorning?: number;
  perKmNight?: number;
  cancellationFee?: number;
  serviceCharge?: number;
}

// Tool types
export interface Tool {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  requirements?: Record<string, unknown>;
  status?: string;
  serviceTypeId?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  requirements?: Record<string, unknown>;
  status?: string;
  serviceTypeId?: number;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  requirements?: Record<string, unknown>;
  status?: string;
  serviceTypeId?: number;
}

// Program types
export interface Program {
  id: number;
  title: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  serviceTypeId?: number;
  stages?: ProgramStage[];
  createdAt?: string;
}
export interface CreateProgramRequest { title: string; description?: string; isActive?: boolean; order?: number; serviceTypeId?: number; }
export interface UpdateProgramRequest { title?: string; description?: string; isActive?: boolean; order?: number; serviceTypeId?: number; }

export interface ProgramStage {
  id: number;
  programId: number;
  title: string;
  shortTitle?: string;
  order?: number;
  isActive?: boolean;
  videos?: ProgramVideo[];
  createdAt?: string;
}
export interface CreateStageRequest { programId: number; title: string; shortTitle?: string; order?: number; }
export interface UpdateStageRequest { title?: string; shortTitle?: string; order?: number; isActive?: boolean; }

export interface ProgramVideo {
  id: number;
  stageId: number;
  title: string;
  youtubeUrl: string;
  category?: string;
  level?: string;
  difficulty?: string;
  equipment?: string;
  duration?: string;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
}
export interface CreateVideoRequest { stageId: number; title: string; youtubeUrl: string; category?: string; level?: string; difficulty?: string; equipment?: string; duration?: string; order?: number; }
export interface UpdateVideoRequest { title?: string; youtubeUrl?: string; category?: string; level?: string; difficulty?: string; equipment?: string; duration?: string; order?: number; isActive?: boolean; }

// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  results?: T;
  [key: string]: unknown;
}
