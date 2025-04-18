/* tslint:disable */
/* eslint-disable */
/**
 * Lazy.Blog.Api | v1
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';

export interface CreateRoleRequest {
    roleName?: string;
}

/**
 * RoleApi - interface
 * 
 * @export
 * @interface RoleApiInterface
 */
export interface RoleApiInterface {
    /**
     * 
     * @param {string} [roleName] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RoleApiInterface
     */
    createRoleRaw(requestParameters: CreateRoleRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     */
    createRole(requestParameters: CreateRoleRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

}

/**
 * 
 */
export class RoleApi extends runtime.BaseAPI implements RoleApiInterface {

    /**
     */
    async createRoleRaw(requestParameters: CreateRoleRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters['roleName'] != null) {
            queryParameters['roleName'] = requestParameters['roleName'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/CreateRole`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async createRole(requestParameters: CreateRoleRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.createRoleRaw(requestParameters, initOverrides);
    }

}
