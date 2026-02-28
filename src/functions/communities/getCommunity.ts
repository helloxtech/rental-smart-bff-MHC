import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DataverseClient } from "../../services/dataverseClient";
import { ApiError, Community } from "../../types";

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
 * @function getCommunity
 * @param {HttpRequest} request
 * @param {InvocationContext} _context
 * @returns {Promise<HttpResponseInit>}
 */
export async function getCommunity(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit>
{
    const id: string | undefined = request.params.id;
    if (id === undefined || id.length === 0)
    {
        return errorResponse(400, "VALIDATION_ERROR", "Community id is required.", "id");
    }

    try
    {
        const client: DataverseClient = createClient();
        const result: any = await client.retrieve("hx_communities", id, "?$select=hx_communityid,hx_name,hx_state,hx_lotcount");
        const response: Community =
        {
            id: result.hx_communityid,
            name: result.hx_name ?? "",
            state: result.hx_state ?? "",
            lotCount: Number(result.hx_lotcount ?? 0)
        };

        return { status: 200, jsonBody: response };
    }
    catch (error)
    {
        return errorResponse(404, "COMMUNITY_NOT_FOUND", (error as Error).message, id);
    }
}
