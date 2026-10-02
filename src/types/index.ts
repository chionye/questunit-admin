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
  newRequests: number;
  activeRequests: number;
  completedRequests: number;
  revenue: number;
}

export interface MonthlyTrendPoint {
  month: string;
  value: number;
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

export interface RequesterDocument {
  type: string;
  documentNumber: string | null;
  status: string;
  url: string;
  notes?: string | null;
  createdAt: string;
}

export interface RequesterUser {
  id: number;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  onboardingStep?: string | null;
  isOnboardingComplete?: boolean;
  UserProfile: {
    firstName: string | null;
    lastName: string | null;
    dob: string | null;
    gender: string | null;
    profilePhoto: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
  Documents?: RequesterDocument[];
  Wallet?: { balance: number; taskBalance?: number } | null;
  serviceCounts?: { completed: number; cancelled: number; pending: number };
}

export interface RecentService {
  id: number;
  name: string;
  category: string;
  status: string;
  isActive?: boolean;
  createdAt: string;
}

export interface DashboardOverview {
  counts: DashboardCounts;
  monthlyTrends?: {
    revenue?: MonthlyTrendPoint[];
    requests?: MonthlyTrendPoint[];
  };
  recentActivities: {
    users: RecentUser[];
    services: RecentService[];
  };
}

// Renderer types
export interface RendererUserService {
  id: number;
  serviceId: number;
  serviceTypeId?: number | null;
  description?: string | null;
  approvalStatus?: string;
  rejectionReason?: string | null;
  Service?: {
    name?: string;
    category?: string;
    commissionPercentage?: number | null;
  } | null;
  ServiceType?: {
    id?: number;
    name?: string;
  } | null;
}

export interface Renderer {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  UserProfile?: {
    firstName?: string | null;
    lastName?: string | null;
    profilePhoto?: string | null;
    bio?: string | null;
    hourlyRate?: number | null;
    skills?: string[] | null;
    experience?: string | null;
  } | null;
  UserServices?: RendererUserService[];
  Documents?: RequesterDocument[];
  serviceCounts?: { completed: number; cancelled: number; pending: number };
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

export interface EditUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  dob?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  hourlyRate?: number;
  skills?: string[];
  experience?: string;
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
  formConfig?: FormConfigField[] | null;
  safetyGuidelines?: string | null;
  isActive?: boolean;
  commissionPercentage?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  ServiceTypes?: ServiceType[];
  [key: string]: unknown;
}

export interface FormConfigOption {
  label: string;
  value: string;
}

export interface FormConfigField {
  title: string;
  type: "select" | "select-counter" | "input" | "text";
  name: string;
  options?: FormConfigOption[];
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
  commissionPercentage?: number;
  formConfig?: FormConfigField[] | null;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
  commissionPercentage?: number;
  formConfig?: FormConfigField[] | null;
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
  videoUrl?: string | null;
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
  videoUrl?: string;
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
  videoUrl?: string;
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

// Service Type Video types
export interface ServiceTypeVideo {
  id: number;
  title: string;
  videoUrl: string;
  serviceId: number | null;
  serviceTypeIds: number[];
  isActive: boolean;
  createdAt?: string;
}
export interface CreateServiceTypeVideoRequest {
  title: string;
  videoUrl: string;
  serviceId?: number | null;
  serviceTypeIds: number[];
  isActive?: boolean;
}
export interface UpdateServiceTypeVideoRequest {
  title?: string;
  videoUrl?: string;
  serviceId?: number | null;
  serviceTypeIds?: number[];
  isActive?: boolean;
}

// User Report types
export interface UserReportUser {
  id: number;
  phone: string | null;
  email: string | null;
  UserProfile: {
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
  } | null;
}

export interface UserReport {
  id: number;
  reporterId: number;
  reportedUserId: number;
  chatId: number | null;
  requestId: number | null;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  adminNotes: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: UserReportUser;
  reportedUser?: UserReportUser;
}

export interface UpdateReportStatusRequest {
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  adminNotes?: string;
}

// Task types
export interface Task {
  id: number;
  title: string;
  description?: string | null;
  link?: string | null;
  imageUrl?: string | null;
  amount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  amount: number;
  isActive?: boolean;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  amount?: number;
  isActive?: boolean;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  results?: T;
  [key: string]: unknown;
}

// Email types
export interface EmailRecipient {
  id: number;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt?: string;
  UserProfile: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface SendEmailRequest {
  userId: number;
  subject: string;
  mailTitle?: string;
  body: string;
}

export interface SendBulkEmailRequest {
  userIds?: number[];
  role?: string;
  status?: string;
  search?: string;
  subject: string;
  mailTitle?: string;
  body: string;
}

export interface SendEmailResult {
  sent: boolean;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export interface BulkSendResult {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  results: {
    id: number;
    email: string;
    sent: boolean;
    error?: string | null;
  }[];
}

// App version types
export interface AppVersion {
  id: number;
  platform: 'ios' | 'android';
  version: string;
  minimumVersion: string;
  buildNumber?: string | null;
  storeUrl?: string | null;
  releaseNotes?: string | null;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppVersionRequest {
  platform: 'ios' | 'android';
  version: string;
  minimumVersion?: string;
  buildNumber?: string;
  storeUrl?: string;
  releaseNotes?: string;
  isRequired?: boolean;
}

export interface UpdateAppVersionRequest {
  platform?: 'ios' | 'android';
  version?: string;
  minimumVersion?: string;
  buildNumber?: string;
  storeUrl?: string;
  releaseNotes?: string;
  isRequired?: boolean;
}
