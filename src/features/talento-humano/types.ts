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
  workProcess: string | null;
};

export type EmployeeOrgRef = {
  id: string;
  name: string;
};

export type EmployeeDetail = {
  id: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string | null;
  genderCatalogKey: string | null;
  bloodTypeCatalogKey: string | null;
  maritalStatusCatalogKey: string | null;
  mobilePhone: string | null;
  email: string | null;
  fieldWork: boolean | null;
  isActive: boolean;
  userId: string | null;
  currentWorkLocation: {
    id: string;
    startDate: string | null;
    managementUnit: EmployeeOrgRef | null;
    area: EmployeeOrgRef | null;
    workProcess: EmployeeOrgRef | null;
    jobPosition: EmployeeOrgRef | null;
    zone: EmployeeOrgRef | null;
  } | null;
  currentContract: {
    id: string;
    contractTypeCatalogKey: string | null;
    startDate: string | null;
  } | null;
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

export type UpdateEmployeePayload = Omit<CreateEmployeePayload, "documentNumber"> & {
  documentNumber?: string;
  isActive?: boolean;
};
