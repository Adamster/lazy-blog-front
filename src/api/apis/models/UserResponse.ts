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
 * @interface UserResponse
 */
export interface UserResponse {
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    id?: string;
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    email?: string;
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    firstName?: string;
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    lastName?: string;
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    userName?: string;
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    biography?: string | null;
    /**
     * 
     * @type {string}
     * @memberof UserResponse
     */
    avatarUrl?: string | null;
    /**
     * 
     * @type {Date}
     * @memberof UserResponse
     */
    createdOnUtc?: Date;
}

/**
 * Check if a given object implements the UserResponse interface.
 */
export function instanceOfUserResponse(value: object): value is UserResponse {
    return true;
}

export function UserResponseFromJSON(json: any): UserResponse {
    return UserResponseFromJSONTyped(json, false);
}

export function UserResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UserResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'] == null ? undefined : json['id'],
        'email': json['email'] == null ? undefined : json['email'],
        'firstName': json['firstName'] == null ? undefined : json['firstName'],
        'lastName': json['lastName'] == null ? undefined : json['lastName'],
        'userName': json['userName'] == null ? undefined : json['userName'],
        'biography': json['biography'] == null ? undefined : json['biography'],
        'avatarUrl': json['avatarUrl'] == null ? undefined : json['avatarUrl'],
        'createdOnUtc': json['createdOnUtc'] == null ? undefined : (new Date(json['createdOnUtc'])),
    };
}

export function UserResponseToJSON(json: any): UserResponse {
    return UserResponseToJSONTyped(json, false);
}

export function UserResponseToJSONTyped(value?: UserResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'email': value['email'],
        'firstName': value['firstName'],
        'lastName': value['lastName'],
        'userName': value['userName'],
        'biography': value['biography'],
        'avatarUrl': value['avatarUrl'],
        'createdOnUtc': value['createdOnUtc'] == null ? undefined : ((value['createdOnUtc']).toISOString()),
    };
}

