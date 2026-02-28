import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DataverseClient } from "../../services/dataverseClient";
import { ApiError, DashboardKPI } from "../../types";

/**
 * @function createClient
 * @returns {DataverseClient}
 */
function createClient(): DataverseClient
{
    return new DataverseClient(
        process.env.DATAVERSE_URL ?? "https://rsmhcus.crm.dynamics.com",
        process.env.DATAVERSE_CLIENT_ID ?? "053525c8-e70f-4cc9-a941-f654a027f32c",
        process.env.DATAVERSE_TENANT_ID ?? "45208155-ce24-47ba-a6b4-637dc38c8804",
        process.env.DATAVERSE_CLIENT_SECRET ?? ""
    );
}

/**
 * @function toNumber
 * @param {unknown} value
 * @returns {number}
 */
function toNumber(value: unknown): number
{
    const num: number = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
}

/**
 * @function errorResponse
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {string} target
 * @returns {HttpResponseInit}
 */
function errorResponse(status: number, code: string, message: string, target: string): HttpResponseInit
{
    const body: ApiError = { error: { code, message, target } };
    return { status, jsonBody: body };
}

/**
 * @function getDashboard
 * @param {HttpRequest} request
 * @param {InvocationContext} _context
 * @returns {Promise<HttpResponseInit>}
 */
export async function getDashboard(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit>
{
    const id: string | undefined = request.params.id;
    if (id === undefined || id.length === 0)
    {
        return errorResponse(400, "VALIDATION_ERROR", "Community id is required.", "id");
    }

    try
    {
        const client: DataverseClient = createClient();
        const lots: any = await client.retrieveMultiple("hx_lots", `?$select=hx_status&$filter=_hx_communityid_value eq guid'${id}'`);
        const leases: any = await client.retrieveMultiple("hx_leases", `?$select=hx_monthlyamount,hx_isactive&$filter=_hx_communityid_value eq guid'${id}' and hx_isactive eq true`);
        const maintenance: any = await client.retrieveMultiple("hx_maintenancerequests", `?$select=hx_maintenancerequestid&$filter=_hx_communityid_value eq guid'${id}' and hx_status ne 2`);

        const lotRows: any[] = Array.isArray(lots?.value) ? lots.value : [];
        const totalLots: number = lotRows.length;
        const occupiedLots: number = lotRows.filter((row: any): boolean => Number(row.hx_status) === 1).length;

        const leaseRows: any[] = Array.isArray(leases?.value) ? leases.value : [];
        const monthlyRevenue: number = leaseRows.reduce(
            (sum: number, lease: any): number => sum + toNumber(lease.hx_monthlyamount),
            0
        );

        const maintenanceRows: any[] = Array.isArray(maintenance?.value) ? maintenance.value : [];

        const data: DashboardKPI =
        {
            occupancyRate: totalLots === 0 ? 0 : Number(((occupiedLots / totalLots) * 100).toFixed(2)),
            monthlyRevenue,
            maintenanceOpenCount: maintenanceRows.length
        };

        return { status: 200, jsonBody: data };
    }
    catch (error)
    {
        return errorResponse(500, "DASHBOARD_FAILED", (error as Error).message, id);
    }
}
