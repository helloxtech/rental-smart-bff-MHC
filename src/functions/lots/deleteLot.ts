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
 * @function deleteLot
 * @param {HttpRequest} request
 * @param {InvocationContext} _context
 * @returns {Promise<HttpResponseInit>}
 */
export async function deleteLot(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit>
{
    const lotId: string | undefined = request.params.id;
    if (lotId === undefined || lotId.length === 0)
    {
        return errorResponse(400, "VALIDATION_ERROR", "Lot id is required.", "id");
    }

    try
    {
        const client: DataverseClient = createClient();
        const lot: any = await client.retrieve("hx_lots", lotId, "?$select=hx_status");
        if (Number(lot?.hx_status) === 1)
        {
            return errorResponse(400, "LOT_OCCUPIED", "Cannot delete occupied lot.", lotId);
        }

        await client.delete("hx_lots", lotId);
        return { status: 204 };
    }
    catch (error)
    {
        return errorResponse(500, "LOT_DELETE_FAILED", (error as Error).message, lotId);
    }
}
