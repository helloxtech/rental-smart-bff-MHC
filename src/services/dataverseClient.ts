/**
 * @file dataverseClient.ts
 * @description Dataverse Web API client with MSAL client credentials flow.
 */

import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";

/**
 * @class DataverseClient
 * @description Wrapper for Dataverse Web API operations.
 */
export class DataverseClient
{
    private baseUrl: string;
    private scope: string;
    private msalClient: ConfidentialClientApplication;

    /**
     * @constructor
     * @param {string} resourceUrl
     * @param {string} clientId
     * @param {string} tenantId
     * @param {string} clientSecret
     */
    constructor(resourceUrl: string, clientId: string, tenantId: string, clientSecret: string)
    {
        this.baseUrl = `${resourceUrl}/api/data/v9.2`;
        this.scope = `${resourceUrl}/.default`;

        const config: Configuration =
        {
            auth:
            {
                clientId,
                authority: `https://login.microsoftonline.com/${tenantId}`,
                clientSecret
            }
        };

        this.msalClient = new ConfidentialClientApplication(config);
    }

    /**
     * @function retrieveMultiple
     * @param {string} entitySet
     * @param {string} query
     * @returns {Promise<any>}
     */
    public async retrieveMultiple(entitySet: string, query: string = ""): Promise<any>
    {
        const path: string = query.length > 0 ? `${entitySet}${query}` : entitySet;
        return this.request("GET", path);
    }

    /**
     * @function retrieve
     * @param {string} entitySet
     * @param {string} id
     * @param {string} query
     * @returns {Promise<any>}
     */
    public async retrieve(entitySet: string, id: string, query: string = ""): Promise<any>
    {
        const suffix: string = query.length > 0 ? query : "";
        return this.request("GET", `${entitySet}(${id})${suffix}`);
    }

    /**
     * @function create
     * @param {string} entitySet
     * @param {Record<string, unknown>} payload
     * @returns {Promise<any>}
     */
    public async create(entitySet: string, payload: Record<string, unknown>): Promise<any>
    {
        return this.request("POST", entitySet, payload);
    }

    /**
     * @function update
     * @param {string} entitySet
     * @param {string} id
     * @param {Record<string, unknown>} payload
     * @returns {Promise<void>}
     */
    public async update(entitySet: string, id: string, payload: Record<string, unknown>): Promise<void>
    {
        await this.request("PATCH", `${entitySet}(${id})`, payload);
    }

    /**
     * @function delete
     * @param {string} entitySet
     * @param {string} id
     * @returns {Promise<void>}
     */
    public async delete(entitySet: string, id: string): Promise<void>
    {
        await this.request("DELETE", `${entitySet}(${id})`);
    }

    /**
     * @function getToken
     * @returns {Promise<string>}
     */
    private async getToken(): Promise<string>
    {
        const result = await this.msalClient.acquireTokenByClientCredential(
            {
                scopes: [this.scope]
            }
        );

        if (result === null || result.accessToken === undefined || result.accessToken.length === 0)
        {
            throw new Error("Token acquisition failed.");
        }

        return result.accessToken;
    }

    /**
     * @function request
     * @param {string} method
     * @param {string} path
     * @param {Record<string, unknown>} [payload]
     * @returns {Promise<any>}
     */
    private async request(method: string, path: string, payload?: Record<string, unknown>): Promise<any>
    {
        const token: string = await this.getToken();
        const url: string = `${this.baseUrl}/${path}`;

        const headers: Record<string, string> =
        {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            Prefer: "odata.include-annotations=\"*\""
        };

        const response: Response = await fetch(url,
            {
                method,
                headers,
                body: payload !== undefined ? JSON.stringify(payload) : undefined
            }
        );

        if (response.status === 204)
        {
            return null;
        }

        if (response.ok === false)
        {
            const text: string = await response.text();
            throw new Error(`Dataverse request failed (${response.status}): ${text}`);
        }

        const contentType: string | null = response.headers.get("content-type");
        if (contentType === null || contentType.includes("application/json") === false)
        {
            return null;
        }

        return response.json();
    }
}
