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
