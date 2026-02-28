import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DataverseClient } from "../../services/dataverseClient";
import { ApiError, Community, PaginatedResponse } from "../../types";

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
 * @function parseNumber
 * @param {string | null} value
 * @param {number} fallback
 * @returns {number}
 */
function parseNumber(value: string | null, fallback: number): number
{
    if (value === null)
    {
        return fallback;
    }

    const parsed: number = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
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
 * @function getCommunities
 * @param {HttpRequest} request
 * @param {InvocationContext} _context
 * @returns {Promise<HttpResponseInit>}
 */
export async function getCommunities(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit>
{
    try
    {
        const page: number = Math.max(1, parseNumber(request.query.get("page"), 1));
        const pageSize: number = Math.max(1, Math.min(100, parseNumber(request.query.get("pageSize"), 20)));
        const skip: number = (page - 1) * pageSize;

        const client: DataverseClient = createClient();
        const query: string = `?$select=hx_communityid,hx_name,hx_state,hx_lotcount&$orderby=hx_name asc&$top=${pageSize}&$skip=${skip}&$count=true`;
        const result: any = await client.retrieveMultiple("hx_communities", query);

        const records: any[] = Array.isArray(result?.value) ? result.value : [];
        const items: Community[] = records.map(
            (row: any): Community =>
            ({
                id: row.hx_communityid,
                name: row.hx_name ?? "",
                state: row.hx_state ?? "",
                lotCount: Number(row.hx_lotcount ?? 0)
            })
        );

        const totalCount: number = Number(result?.["@odata.count"] ?? items.length);
        const response: PaginatedResponse<Community> =
        {
            data: items,
            page,
            pageSize,
            totalCount,
            hasNextPage: page * pageSize < totalCount
        };

        return { status: 200, jsonBody: response };
    }
    catch (error)
    {
        return errorResponse(500, "COMMUNITY_LIST_FAILED", (error as Error).message, "communities");
    }
}
