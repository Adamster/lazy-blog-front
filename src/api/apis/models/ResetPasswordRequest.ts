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

import { mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface ResetPasswordRequest
 */
export interface ResetPasswordRequest {
    /**
     * 
     * @type {string}
     * @memberof ResetPasswordRequest
     */
    token: string;
    /**
     * 
     * @type {string}
     * @memberof ResetPasswordRequest
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof ResetPasswordRequest
     */
    newPassword: string;
}

/**
 * Check if a given object implements the ResetPasswordRequest interface.
 */
export function instanceOfResetPasswordRequest(value: object): value is ResetPasswordRequest {
    if (!('token' in value) || value['token'] === undefined) return false;
    if (!('email' in value) || value['email'] === undefined) return false;
    if (!('newPassword' in value) || value['newPassword'] === undefined) return false;
    return true;
}

export function ResetPasswordRequestFromJSON(json: any): ResetPasswordRequest {
    return ResetPasswordRequestFromJSONTyped(json, false);
}

export function ResetPasswordRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): ResetPasswordRequest {
    if (json == null) {
        return json;
    }
    return {
        
        'token': json['token'],
        'email': json['email'],
        'newPassword': json['newPassword'],
    };
}

export function ResetPasswordRequestToJSON(json: any): ResetPasswordRequest {
    return ResetPasswordRequestToJSONTyped(json, false);
}

export function ResetPasswordRequestToJSONTyped(value?: ResetPasswordRequest | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'token': value['token'],
        'email': value['email'],
        'newPassword': value['newPassword'],
    };
}

