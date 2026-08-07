export type EmployeeListItem = {
  id: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  mobilePhone: string | null;
  email: string | null;
  userId: string | null;
  createdAt: string;
  jobPosition: string | null;
  area: string | null;
  zone: string | null;
  managementUnit: string | null;
};

export type JobPositionItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { employeeWorkLocations: number };
};

export type AreaItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  managementUnit: { id: string; name: string } | null;
  _count: { workProcesses: number; employeeWorkLocations: number };
};

export type ZoneItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { employeeWorkLocations: number };
};

export type WorkProcessItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  area: {
    id: string;
    name: string;
    managementUnit: { id: string; name: string } | null;
  } | null;
  _count: { employeeWorkLocations: number };
};

export type ManagementUnitItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { areas: number };
};

export type CreateEmployeePayload = {
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  genderCatalogKey?: string;
  bloodTypeCatalogKey?: string;
  maritalStatusCatalogKey?: string;
  mobilePhone?: string;
  email?: string;
  fieldWork?: boolean;
  startDate?: string;
  contractTypeCatalogKey?: string;
  workLocation?: {
    managementUnitId?: string;
    areaId?: string;
    workProcessId?: string;
    jobPositionId?: string;
    zoneId?: string;
  };
};
