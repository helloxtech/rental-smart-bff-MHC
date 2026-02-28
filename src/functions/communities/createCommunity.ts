import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DataverseClient } from "../../services/dataverseClient";
import { ApiError } from "../../types";

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
 * @function createCommunity
 * @param {HttpRequest} request
 * @param {InvocationContext} _context
 * @returns {Promise<HttpResponseInit>}
 */
export async function createCommunity(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit>
{
    try
    {
        const payload: any = await request.json();
        if (payload?.name === undefined || String(payload.name).trim().length === 0)
        {
            return errorResponse(400, "VALIDATION_ERROR", "Community name is required.", "name");
        }

        const client: DataverseClient = createClient();
        const body: Record<string, unknown> =
        {
            hx_name: String(payload.name).trim(),
            hx_state: String(payload.state ?? ""),
            hx_lotcount: Number(payload.lotCount ?? 0)
        };

        const created: any = await client.create("hx_communities", body);
        return { status: 201, jsonBody: created ?? { success: true } };
    }
    catch (error)
    {
        return errorResponse(500, "COMMUNITY_CREATE_FAILED", (error as Error).message, "community");
    }
}
