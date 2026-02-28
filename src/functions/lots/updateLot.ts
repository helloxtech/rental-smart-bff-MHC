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
 * @function updateLot
 * @param {HttpRequest} request
 * @param {InvocationContext} _context
 * @returns {Promise<HttpResponseInit>}
 */
export async function updateLot(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit>
{
    const lotId: string | undefined = request.params.id;
    if (lotId === undefined || lotId.length === 0)
    {
        return errorResponse(400, "VALIDATION_ERROR", "Lot id is required.", "id");
    }

    try
    {
        const payload: any = await request.json();
        const body: Record<string, unknown> = {};

        if (payload.lotNumber !== undefined)
        {
            body.hx_lotnumber = String(payload.lotNumber);
        }

        if (payload.status !== undefined)
        {
            body.hx_status = Number(payload.status);
        }

        if (payload.monthlyRent !== undefined)
        {
            body.hx_monthlyrent = Number(payload.monthlyRent);
        }

        const client: DataverseClient = createClient();
        await client.update("hx_lots", lotId, body);
        return { status: 204 };
    }
    catch (error)
    {
        return errorResponse(500, "LOT_UPDATE_FAILED", (error as Error).message, lotId);
    }
}
