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
 * @function deleteCommunity
 * @param {HttpRequest} request
 * @param {InvocationContext} _context
 * @returns {Promise<HttpResponseInit>}
 */
export async function deleteCommunity(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit>
{
    const id: string | undefined = request.params.id;
    if (id === undefined || id.length === 0)
    {
        return errorResponse(400, "VALIDATION_ERROR", "Community id is required.", "id");
    }

    try
    {
        const client: DataverseClient = createClient();
        const lots: any = await client.retrieveMultiple("hx_lots", `?$select=hx_lotid&$filter=_hx_communityid_value eq guid'${id}'&$top=1`);
        const lotRows: any[] = Array.isArray(lots?.value) ? lots.value : [];
        if (lotRows.length > 0)
        {
            return errorResponse(400, "COMMUNITY_HAS_LOTS", "Cannot delete community with lots.", id);
        }

        await client.delete("hx_communities", id);
        return { status: 204 };
    }
    catch (error)
    {
        return errorResponse(500, "COMMUNITY_DELETE_FAILED", (error as Error).message, id);
    }
}
