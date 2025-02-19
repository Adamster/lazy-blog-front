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
import type { NullableOfVoteDirection } from './NullableOfVoteDirection';
import {
    NullableOfVoteDirectionFromJSON,
    NullableOfVoteDirectionFromJSONTyped,
    NullableOfVoteDirectionToJSON,
    NullableOfVoteDirectionToJSONTyped,
} from './NullableOfVoteDirection';

/**
 * 
 * @export
 * @interface PublishedPostResponse
 */
export interface PublishedPostResponse {
    /**
     * 
     * @type {string}
     * @memberof PublishedPostResponse
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof PublishedPostResponse
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof PublishedPostResponse
     */
    summary: string | null;
    /**
     * 
     * @type {string}
     * @memberof PublishedPostResponse
     */
    slug: string;
    /**
     * 
     * @type {UserResponse}
     * @memberof PublishedPostResponse
     */
    author: UserResponse;
    /**
     * 
     * @type {number}
     * @memberof PublishedPostResponse
     */
    views: number;
    /**
     * 
     * @type {number}
     * @memberof PublishedPostResponse
     */
    comments: number;
    /**
     * 
     * @type {number}
     * @memberof PublishedPostResponse
     */
    rating: number;
    /**
     * 
     * @type {NullableOfVoteDirection}
     * @memberof PublishedPostResponse
     */
    voteDirection: NullableOfVoteDirection | null;
    /**
     * 
     * @type {string}
     * @memberof PublishedPostResponse
     */
    coverUrl: string | null;
    /**
     * 
     * @type {Array<TagResponse>}
     * @memberof PublishedPostResponse
     */
    tags: Array<TagResponse>;
    /**
     * 
     * @type {Date}
     * @memberof PublishedPostResponse
     */
    createdAtUtc: Date;
}



/**
 * Check if a given object implements the PublishedPostResponse interface.
 */
export function instanceOfPublishedPostResponse(value: object): value is PublishedPostResponse {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('title' in value) || value['title'] === undefined) return false;
    if (!('summary' in value) || value['summary'] === undefined) return false;
    if (!('slug' in value) || value['slug'] === undefined) return false;
    if (!('author' in value) || value['author'] === undefined) return false;
    if (!('views' in value) || value['views'] === undefined) return false;
    if (!('comments' in value) || value['comments'] === undefined) return false;
    if (!('rating' in value) || value['rating'] === undefined) return false;
    if (!('voteDirection' in value) || value['voteDirection'] === undefined) return false;
    if (!('coverUrl' in value) || value['coverUrl'] === undefined) return false;
    if (!('tags' in value) || value['tags'] === undefined) return false;
    if (!('createdAtUtc' in value) || value['createdAtUtc'] === undefined) return false;
    return true;
}

export function PublishedPostResponseFromJSON(json: any): PublishedPostResponse {
    return PublishedPostResponseFromJSONTyped(json, false);
}

export function PublishedPostResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): PublishedPostResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'title': json['title'],
        'summary': json['summary'],
        'slug': json['slug'],
        'author': UserResponseFromJSON(json['author']),
        'views': json['views'],
        'comments': json['comments'],
        'rating': json['rating'],
        'voteDirection': NullableOfVoteDirectionFromJSON(json['voteDirection']),
        'coverUrl': json['coverUrl'],
        'tags': ((json['tags'] as Array<any>).map(TagResponseFromJSON)),
        'createdAtUtc': (new Date(json['createdAtUtc'])),
    };
}

export function PublishedPostResponseToJSON(json: any): PublishedPostResponse {
    return PublishedPostResponseToJSONTyped(json, false);
}

export function PublishedPostResponseToJSONTyped(value?: PublishedPostResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'title': value['title'],
        'summary': value['summary'],
        'slug': value['slug'],
        'author': UserResponseToJSON(value['author']),
        'views': value['views'],
        'comments': value['comments'],
        'rating': value['rating'],
        'voteDirection': NullableOfVoteDirectionToJSON(value['voteDirection']),
        'coverUrl': value['coverUrl'],
        'tags': ((value['tags'] as Array<any>).map(TagResponseToJSON)),
        'createdAtUtc': ((value['createdAtUtc']).toISOString()),
    };
}

