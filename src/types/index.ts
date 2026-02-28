/**
 * @file index.ts
 * @description Shared API types for Rental Smart BFF.
 */

/**
 * @interface Community
 * @description Community projection used by BFF and portal.
 */
export interface Community
{
    id: string;
    name: string;
    state: string;
    lotCount: number;
}

/**
 * @interface Lot
 * @description Lot projection used by BFF and portal.
 */
export interface Lot
{
    id: string;
    communityId: string;
    lotNumber: string;
    status: number;
    statusLabel?: string;
    monthlyRent?: number;
}

/**
 * @interface DashboardKPI
 * @description Computed dashboard metrics for a community.
 */
export interface DashboardKPI
{
    occupancyRate: number;
    monthlyRevenue: number;
    maintenanceOpenCount: number;
}

/**
 * @interface ApiError
 * @description Standard API error shape.
 */
export interface ApiError
{
    error:
    {
        code: string;
        message: string;
        target: string;
    };
}

/**
 * @interface PaginatedResponse
 * @description Generic paginated response wrapper.
 * @template T
 */
export interface PaginatedResponse<T>
{
    data: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
}
