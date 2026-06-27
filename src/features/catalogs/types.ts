export interface CatalogSummary {
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItemOption {
  key: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
}
