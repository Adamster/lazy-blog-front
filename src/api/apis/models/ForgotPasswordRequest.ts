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
 * @interface ForgotPasswordRequest
 */
export interface ForgotPasswordRequest {
    /**
     * 
     * @type {string}
     * @memberof ForgotPasswordRequest
     */
    email: string;
}

/**
 * Check if a given object implements the ForgotPasswordRequest interface.
 */
export function instanceOfForgotPasswordRequest(value: object): value is ForgotPasswordRequest {
    if (!('email' in value) || value['email'] === undefined) return false;
    return true;
}

export function ForgotPasswordRequestFromJSON(json: any): ForgotPasswordRequest {
    return ForgotPasswordRequestFromJSONTyped(json, false);
}

export function ForgotPasswordRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): ForgotPasswordRequest {
    if (json == null) {
        return json;
    }
    return {
        
        'email': json['email'],
    };
}

export function ForgotPasswordRequestToJSON(json: any): ForgotPasswordRequest {
    return ForgotPasswordRequestToJSONTyped(json, false);
}

export function ForgotPasswordRequestToJSONTyped(value?: ForgotPasswordRequest | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'email': value['email'],
    };
}

