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
import type { TagPostResponse } from './TagPostResponse';
import {
    TagPostResponseFromJSON,
    TagPostResponseFromJSONTyped,
    TagPostResponseToJSON,
    TagPostResponseToJSONTyped,
} from './TagPostResponse';
import type { AuthorPostResponse } from './AuthorPostResponse';
import {
    AuthorPostResponseFromJSON,
    AuthorPostResponseFromJSONTyped,
    AuthorPostResponseToJSON,
    AuthorPostResponseToJSONTyped,
} from './AuthorPostResponse';
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
 * @interface DisplayPostResponse
 */
export interface DisplayPostResponse {
    /**
     * 
     * @type {string}
     * @memberof DisplayPostResponse
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof DisplayPostResponse
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof DisplayPostResponse
     */
    summary: string | null;
    /**
     * 
     * @type {string}
     * @memberof DisplayPostResponse
     */
    slug: string;
    /**
     * 
     * @type {boolean}
     * @memberof DisplayPostResponse
     */
    isPublished: boolean;
    /**
     * 
     * @type {AuthorPostResponse}
     * @memberof DisplayPostResponse
     */
    author: AuthorPostResponse;
    /**
     * 
     * @type {number}
     * @memberof DisplayPostResponse
     */
    views: number;
    /**
     * 
     * @type {number}
     * @memberof DisplayPostResponse
     */
    comments: number;
    /**
     * 
     * @type {number}
     * @memberof DisplayPostResponse
     */
    rating: number;
    /**
     * 
     * @type {NullableOfVoteDirection}
     * @memberof DisplayPostResponse
     */
    voteDirection: NullableOfVoteDirection | null;
    /**
     * 
     * @type {string}
     * @memberof DisplayPostResponse
     */
    coverUrl: string | null;
    /**
     * 
     * @type {Array<TagPostResponse>}
     * @memberof DisplayPostResponse
     */
    tags: Array<TagPostResponse>;
    /**
     * 
     * @type {Date}
     * @memberof DisplayPostResponse
     */
    createdAtUtc: Date;
}



/**
 * Check if a given object implements the DisplayPostResponse interface.
 */
export function instanceOfDisplayPostResponse(value: object): value is DisplayPostResponse {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('title' in value) || value['title'] === undefined) return false;
    if (!('summary' in value) || value['summary'] === undefined) return false;
    if (!('slug' in value) || value['slug'] === undefined) return false;
    if (!('isPublished' in value) || value['isPublished'] === undefined) return false;
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

export function DisplayPostResponseFromJSON(json: any): DisplayPostResponse {
    return DisplayPostResponseFromJSONTyped(json, false);
}

export function DisplayPostResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): DisplayPostResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'title': json['title'],
        'summary': json['summary'],
        'slug': json['slug'],
        'isPublished': json['isPublished'],
        'author': AuthorPostResponseFromJSON(json['author']),
        'views': json['views'],
        'comments': json['comments'],
        'rating': json['rating'],
        'voteDirection': NullableOfVoteDirectionFromJSON(json['voteDirection']),
        'coverUrl': json['coverUrl'],
        'tags': ((json['tags'] as Array<any>).map(TagPostResponseFromJSON)),
        'createdAtUtc': (new Date(json['createdAtUtc'])),
    };
}

export function DisplayPostResponseToJSON(json: any): DisplayPostResponse {
    return DisplayPostResponseToJSONTyped(json, false);
}

export function DisplayPostResponseToJSONTyped(value?: DisplayPostResponse | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'title': value['title'],
        'summary': value['summary'],
        'slug': value['slug'],
        'isPublished': value['isPublished'],
        'author': AuthorPostResponseToJSON(value['author']),
        'views': value['views'],
        'comments': value['comments'],
        'rating': value['rating'],
        'voteDirection': NullableOfVoteDirectionToJSON(value['voteDirection']),
        'coverUrl': value['coverUrl'],
        'tags': ((value['tags'] as Array<any>).map(TagPostResponseToJSON)),
        'createdAtUtc': ((value['createdAtUtc']).toISOString()),
    };
}

