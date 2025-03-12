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
import type { TagPostResponse } from './TagPostResponse';
import {
    TagPostResponseFromJSON,
    TagPostResponseFromJSONTyped,
    TagPostResponseToJSON,
    TagPostResponseToJSONTyped,
} from './TagPostResponse';

/**
 * 
 * @export
 * @interface PostDetailedResponse
 */
export interface PostDetailedResponse {
    /**
     * 
     * @type {string}
     * @memberof PostDetailedResponse
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof PostDetailedResponse
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof PostDetailedResponse
     */
    summary: string | null;
    /**
     * 
     * @type {UserResponse}
     * @memberof PostDetailedResponse
     */
    author: UserResponse;
    /**
     * 
     * @type {string}
     * @memberof PostDetailedResponse
     */
    slug: string;
    /**
     * 
     * @type {string}
     * @memberof PostDetailedResponse
     */
    body: string;
    /**
     * 
     * @type {string}
     * @memberof PostDetailedResponse
     */
    coverUrl: string | null;
    /**
     * 
     * @type {Array<TagPostResponse>}
     * @memberof PostDetailedResponse
     */
    tags: Array<TagPostResponse>;
    /**
     * 
     * @type {number}
     * @memberof PostDetailedResponse
     */
    rating: number;
    /**
     * 
     * @type {number}
     * @memberof PostDetailedResponse
     */
    views: number;
    /**
     * 
     * @type {boolean}
     * @memberof PostDetailedResponse
     */
    isPublished: boolean;
    /**
     * 
     * @type {Date}
     * @memberof PostDetailedResponse
     */
    createdAtUtc: Date;
}

/**
 * Check if a given object implements the PostDetailedResponse interface.
 */
export function instanceOfPostDetailedResponse(value: object): value is PostDetailedResponse {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('title' in value) || value['title'] === undefined) return false;
    if (!('summary' in value) || value['summary'] === undefined) return false;
    if (!('author' in value) || value['author'] === undefined) return false;
    if (!('slug' in value) || value['slug'] === undefined) return false;
    if (!('body' in value) || value['body'] === undefined) return false;
    if (!('coverUrl' in value) || value['coverUrl'] === undefined) return false;
    if (!('tags' in value) || value['tags'] === undefined) return false;
    if (!('rating' in value) || value['rating'] === undefined) return false;
    if (!('views' in value) || value['views'] === undefined) return false;
    if (!('isPublished' in value) || value['isPublished'] === undefined) return false;
    if (!('createdAtUtc' in value) || value['createdAtUtc'] === undefined) return false;
    return true;
}

export function PostDetailedResponseFromJSON(json: any): PostDetailedResponse {
    return PostDetailedResponseFromJSONTyped(json, false);
}

export function PostDetailedResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): PostDetailedResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'title': json['title'],
        'summary': json['summary'],
        'author': UserResponseFromJSON(json['author']),
        'slug': json['slug'],
        'body': json['body'],
        'coverUrl': json['coverUrl'],
        'tags': ((json['tags'] as Array<any>).map(TagPostResponseFromJSON)),
        'rating': json['rating'],
        'views': json['views'],
        'isPublished': json['isPublished'],
        'createdAtUtc': (new Date(json['createdAtUtc'])),
    };
}

export function PostDetailedResponseToJSON(json: any): PostDetailedResponse {
    return PostDetailedResponseToJSONTyped(json, false);
}

export function PostDetailedResponseToJSONTyped(value?: PostDetailedResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'title': value['title'],
        'summary': value['summary'],
        'author': UserResponseToJSON(value['author']),
        'slug': value['slug'],
        'body': value['body'],
        'coverUrl': value['coverUrl'],
        'tags': ((value['tags'] as Array<any>).map(TagPostResponseToJSON)),
        'rating': value['rating'],
        'views': value['views'],
        'isPublished': value['isPublished'],
        'createdAtUtc': ((value['createdAtUtc']).toISOString()),
    };
}

