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
import type { UserResponse } from './UserResponse';
import {
    UserResponseFromJSON,
    UserResponseFromJSONTyped,
    UserResponseToJSON,
    UserResponseToJSONTyped,
} from './UserResponse';
import type { UserPostItem } from './UserPostItem';
import {
    UserPostItemFromJSON,
    UserPostItemFromJSONTyped,
    UserPostItemToJSON,
    UserPostItemToJSONTyped,
} from './UserPostItem';

/**
 * 
 * @export
 * @interface UserPostResponse
 */
export interface UserPostResponse {
    /**
     * 
     * @type {UserResponse}
     * @memberof UserPostResponse
     */
    user: UserResponse;
    /**
     * 
     * @type {Array<UserPostItem>}
     * @memberof UserPostResponse
     */
    postItems: Array<UserPostItem>;
    /**
     * 
     * @type {number}
     * @memberof UserPostResponse
     */
    totalPostCount: number;
}

/**
 * Check if a given object implements the UserPostResponse interface.
 */
export function instanceOfUserPostResponse(value: object): value is UserPostResponse {
    if (!('user' in value) || value['user'] === undefined) return false;
    if (!('postItems' in value) || value['postItems'] === undefined) return false;
    if (!('totalPostCount' in value) || value['totalPostCount'] === undefined) return false;
    return true;
}

export function UserPostResponseFromJSON(json: any): UserPostResponse {
    return UserPostResponseFromJSONTyped(json, false);
}

export function UserPostResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UserPostResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'user': UserResponseFromJSON(json['user']),
        'postItems': ((json['postItems'] as Array<any>).map(UserPostItemFromJSON)),
        'totalPostCount': json['totalPostCount'],
    };
}

export function UserPostResponseToJSON(json: any): UserPostResponse {
    return UserPostResponseToJSONTyped(json, false);
}

export function UserPostResponseToJSONTyped(value?: UserPostResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'user': UserResponseToJSON(value['user']),
        'postItems': ((value['postItems'] as Array<any>).map(UserPostItemToJSON)),
        'totalPostCount': value['totalPostCount'],
    };
}

