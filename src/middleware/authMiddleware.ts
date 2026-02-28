/**
 * @file authMiddleware.ts
 * @description Bearer token validation middleware using MSAL on-behalf-of flow.
 */

import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";
import { ApiError } from "../types";

/**
 * @interface AuthContext
 * @description Auth result payload.
 */
export interface AuthContext
{
    isAuthenticated: boolean;
    roles: string[];
    token: string;
}

/**
 * @function errorResponse
 * @param {string} code
 * @param {string} message
 * @returns {HttpResponseInit}
 */
function errorResponse(code: string, message: string): HttpResponseInit
{
    const body: ApiError =
    {
        error:
        {
            code,
            message,
            target: "authorization"
        }
    };

    return { status: 401, jsonBody: body };
}

/**
 * @function decodeJwtPayload
 * @param {string} token
 * @returns {Record<string, unknown>}
 */
function decodeJwtPayload(token: string): Record<string, unknown>
{
    const segments: string[] = token.split(".");
    if (segments.length < 2)
    {
        return {};
    }

    const payload: string = Buffer.from(segments[1], "base64url").toString("utf8");
    return JSON.parse(payload) as Record<string, unknown>;
}

/**
 * @function extractBearerToken
 * @param {HttpRequest} request
 * @returns {string | null}
 */
function extractBearerToken(request: HttpRequest): string | null
{
    const authHeader: string | null = request.headers.get("authorization");
    if (authHeader === null || authHeader.startsWith("Bearer ") === false)
    {
        return null;
    }

    const token: string = authHeader.replace("Bearer ", "").trim();
    return token.length > 0 ? token : null;
}

/**
 * @function validateAccessToken
 * @param {string} token
 * @returns {Promise<string[]>}
 */
async function validateAccessToken(token: string): Promise<string[]>
{
    const tenantId: string = process.env.DATAVERSE_TENANT_ID ?? "45208155-ce24-47ba-a6b4-637dc38c8804";
    const clientId: string = process.env.DATAVERSE_CLIENT_ID ?? "053525c8-e70f-4cc9-a941-f654a027f32c";
    const clientSecret: string = process.env.DATAVERSE_CLIENT_SECRET ?? "";

    const msalConfig: Configuration =
    {
        auth:
        {
            clientId,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            clientSecret
        }
    };

    const cca: ConfidentialClientApplication = new ConfidentialClientApplication(msalConfig);
    await cca.acquireTokenOnBehalfOf(
        {
            oboAssertion: token,
            scopes: ["https://graph.microsoft.com/.default"],
            skipCache: true
        }
    );

    const claims: Record<string, unknown> = decodeJwtPayload(token);
    const claimRoles: unknown = claims.roles;

    if (Array.isArray(claimRoles) === false)
    {
        return [];
    }

    return claimRoles.map((role: unknown): string => String(role));
}

/**
 * @function authenticateRequest
 * @param {HttpRequest} request
 * @returns {Promise<{ auth?: AuthContext; response?: HttpResponseInit }>}
 */
export async function authenticateRequest(request: HttpRequest): Promise<{ auth?: AuthContext; response?: HttpResponseInit }>
{
    try
    {
        const token: string | null = extractBearerToken(request);
        if (token === null)
        {
            return { response: errorResponse("UNAUTHORIZED", "Missing bearer token.") };
        }

        const roles: string[] = await validateAccessToken(token);
        return { auth: { isAuthenticated: true, roles, token } };
    }
    catch (_error)
    {
        return { response: errorResponse("UNAUTHORIZED", "Invalid bearer token.") };
    }
}
