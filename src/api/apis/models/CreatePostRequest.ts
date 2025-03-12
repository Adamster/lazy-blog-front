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
 * @interface CreatePostRequest
 */
export interface CreatePostRequest {
    /**
     * 
     * @type {string}
     * @memberof CreatePostRequest
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof CreatePostRequest
     */
    summary: string;
    /**
     * 
     * @type {string}
     * @memberof CreatePostRequest
     */
    body: string;
    /**
     * 
     * @type {string}
     * @memberof CreatePostRequest
     */
    userId: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof CreatePostRequest
     */
    tags: Array<string>;
    /**
     * 
     * @type {string}
     * @memberof CreatePostRequest
     */
    coverUrl: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof CreatePostRequest
     */
    isPublished?: boolean;
}

/**
 * Check if a given object implements the CreatePostRequest interface.
 */
export function instanceOfCreatePostRequest(value: object): value is CreatePostRequest {
    if (!('title' in value) || value['title'] === undefined) return false;
    if (!('summary' in value) || value['summary'] === undefined) return false;
    if (!('body' in value) || value['body'] === undefined) return false;
    if (!('userId' in value) || value['userId'] === undefined) return false;
    if (!('tags' in value) || value['tags'] === undefined) return false;
    if (!('coverUrl' in value) || value['coverUrl'] === undefined) return false;
    return true;
}

export function CreatePostRequestFromJSON(json: any): CreatePostRequest {
    return CreatePostRequestFromJSONTyped(json, false);
}

export function CreatePostRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreatePostRequest {
    if (json == null) {
        return json;
    }
    return {
        
        'title': json['title'],
        'summary': json['summary'],
        'body': json['body'],
        'userId': json['userId'],
        'tags': json['tags'],
        'coverUrl': json['coverUrl'],
        'isPublished': json['isPublished'] == null ? undefined : json['isPublished'],
    };
}

export function CreatePostRequestToJSON(json: any): CreatePostRequest {
    return CreatePostRequestToJSONTyped(json, false);
}

export function CreatePostRequestToJSONTyped(value?: CreatePostRequest | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'title': value['title'],
        'summary': value['summary'],
        'body': value['body'],
        'userId': value['userId'],
        'tags': value['tags'],
        'coverUrl': value['coverUrl'],
        'isPublished': value['isPublished'],
    };
}

