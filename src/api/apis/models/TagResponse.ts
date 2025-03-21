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
 * @interface TagResponse
 */
export interface TagResponse {
    /**
     * 
     * @type {string}
     * @memberof TagResponse
     */
    tagId: string;
    /**
     * 
     * @type {string}
     * @memberof TagResponse
     */
    tag: string;
    /**
     * 
     * @type {number}
     * @memberof TagResponse
     */
    postCount: number;
}

/**
 * Check if a given object implements the TagResponse interface.
 */
export function instanceOfTagResponse(value: object): value is TagResponse {
    if (!('tagId' in value) || value['tagId'] === undefined) return false;
    if (!('tag' in value) || value['tag'] === undefined) return false;
    if (!('postCount' in value) || value['postCount'] === undefined) return false;
    return true;
}

export function TagResponseFromJSON(json: any): TagResponse {
    return TagResponseFromJSONTyped(json, false);
}

export function TagResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): TagResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'tagId': json['tagId'],
        'tag': json['tag'],
        'postCount': json['postCount'],
    };
}

export function TagResponseToJSON(json: any): TagResponse {
    return TagResponseToJSONTyped(json, false);
}

export function TagResponseToJSONTyped(value?: TagResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'tagId': value['tagId'],
        'tag': value['tag'],
        'postCount': value['postCount'],
    };
}

