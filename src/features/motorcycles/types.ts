export interface UserBasic {
  id: string;
  name: string;
  email: string;
  picture: string | null;
}

export interface Motorcycle {
  id: string;
  placa: string;
  modelo: string;
  propietario: string;
  cedula: string;
  tipo: string;
  marca: string;
  cilindraje: string;
  telefono: string;
  isActive: boolean;
  userId: string | null;
  user: UserBasic | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMotorcyclePayload {
  placa: string;
  modelo: string;
  propietario: string;
  cedula: string;
  tipo: string;
  marca: string;
  cilindraje: string;
  telefono: string;
  userId?: string;
}

export interface UpdateMotorcyclePayload {
  placa?: string;
  modelo?: string;
  propietario?: string;
  cedula?: string;
  tipo?: string;
  marca?: string;
  cilindraje?: string;
  telefono?: string;
  userId?: string;
}

export interface UseMotorcyclesResult {
  motorcycles: Motorcycle[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
