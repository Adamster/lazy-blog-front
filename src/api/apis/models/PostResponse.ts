/* tslint:disable */
/* eslint-disable */
/**
 * Lazy.App | v1
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
import type { TagResponse } from './TagResponse';
import {
    TagResponseFromJSON,
    TagResponseFromJSONTyped,
    TagResponseToJSON,
    TagResponseToJSONTyped,
} from './TagResponse';

/**
 * 
 * @export
 * @interface PostResponse
 */
export interface PostResponse {
    /**
     * 
     * @type {string}
     * @memberof PostResponse
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof PostResponse
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof PostResponse
     */
    summary: string | null;
    /**
     * 
     * @type {string}
     * @memberof PostResponse
     */
    body: string;
    /**
     * 
     * @type {string}
     * @memberof PostResponse
     */
    slug: string;
    /**
     * 
     * @type {UserResponse}
     * @memberof PostResponse
     */
    author: UserResponse;
    /**
     * 
     * @type {Array<TagResponse>}
     * @memberof PostResponse
     */
    tags: Array<TagResponse>;
    /**
     * 
     * @type {string}
     * @memberof PostResponse
     */
    coverUrl: string | null;
}

/**
 * Check if a given object implements the PostResponse interface.
 */
export function instanceOfPostResponse(value: object): value is PostResponse {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('title' in value) || value['title'] === undefined) return false;
    if (!('summary' in value) || value['summary'] === undefined) return false;
    if (!('body' in value) || value['body'] === undefined) return false;
    if (!('slug' in value) || value['slug'] === undefined) return false;
    if (!('author' in value) || value['author'] === undefined) return false;
    if (!('tags' in value) || value['tags'] === undefined) return false;
    if (!('coverUrl' in value) || value['coverUrl'] === undefined) return false;
    return true;
}

export function PostResponseFromJSON(json: any): PostResponse {
    return PostResponseFromJSONTyped(json, false);
}

export function PostResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): PostResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'title': json['title'],
        'summary': json['summary'],
        'body': json['body'],
        'slug': json['slug'],
        'author': UserResponseFromJSON(json['author']),
        'tags': ((json['tags'] as Array<any>).map(TagResponseFromJSON)),
        'coverUrl': json['coverUrl'],
    };
}

export function PostResponseToJSON(json: any): PostResponse {
    return PostResponseToJSONTyped(json, false);
}

export function PostResponseToJSONTyped(value?: PostResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'title': value['title'],
        'summary': value['summary'],
        'body': value['body'],
        'slug': value['slug'],
        'author': UserResponseToJSON(value['author']),
        'tags': ((value['tags'] as Array<any>).map(TagResponseToJSON)),
        'coverUrl': value['coverUrl'],
    };
}

