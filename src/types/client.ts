import { ClientStatus } from '@prisma/client';

// Query interface for filtering and pagination
export interface ClientQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatus;
  sortBy?: 'nom' | 'prenom' | 'dateNaissance' | 'datePermis' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Request interfaces for API operations
export interface CreateClientRequest {
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  email?: string;
  adresse: string;
  datePermis: string;
  status?: ClientStatus;
  numeroPermis?: string;
  lieuNaissance?: string;
  nationalite?: string;
  profession?: string;
}

export type UpdateClientRequest = Partial<CreateClientRequest>;

// Response interfaces
export interface ClientResponse {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: Date;
  telephone: string;
  email?: string | null;
  adresse: string;
  datePermis: Date;
  status: ClientStatus;
  numeroPermis?: string | null;
  lieuNaissance?: string | null;
  nationalite?: string | null;
  profession?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientListResponse {
  clients: ClientResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientStatsResponse {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  suspendedClients: number;
  statusBreakdown: Array<{
    status: ClientStatus;
    count: number;
  }>;
  recentClients: number; // Clients added in last 30 days
  clientsWithEmail: number;
  clientsWithoutEmail: number;
}

// Internal service interfaces
export interface CreateClientInput {
  nom: string;
  prenom: string;
  dateNaissance: Date | string;
  telephone: string;
  email?: string;
  adresse: string;
  datePermis: Date | string;
  status?: ClientStatus;
  numeroPermis?: string;
  lieuNaissance?: string;
  nationalite?: string;
  profession?: string;
}

export interface UpdateClientInput {
  nom?: string;
  prenom?: string;
  dateNaissance?: Date | string;
  telephone?: string;
  email?: string;
  adresse?: string;
  datePermis?: Date | string;
  status?: ClientStatus;
  numeroPermis?: string | null;
  lieuNaissance?: string | null;
  nationalite?: string | null;
  profession?: string | null;
}

// Search result interface
export interface ClientSearchResult {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  status: ClientStatus;
}

// Bulk operation interfaces
export interface BulkClientStatusUpdate {
  clientIds: string[];
  status: ClientStatus;
}

export interface BulkOperationResult {
  success: boolean;
  affectedCount: number;
  errors?: Array<{
    clientId: string;
    error: string;
  }>;
}