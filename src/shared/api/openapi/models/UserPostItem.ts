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
 * @interface UserPostItem
 */
export interface UserPostItem {
    /**
     * 
     * @type {string}
     * @memberof UserPostItem
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof UserPostItem
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof UserPostItem
     */
    summary: string | null;
    /**
     * 
     * @type {string}
     * @memberof UserPostItem
     */
    slug: string;
    /**
     * 
     * @type {number}
     * @memberof UserPostItem
     */
    views: number;
    /**
     * 
     * @type {number}
     * @memberof UserPostItem
     */
    comments: number;
    /**
     * 
     * @type {number}
     * @memberof UserPostItem
     */
    rating: number;
    /**
     * 
     * @type {NullableOfVoteDirection}
     * @memberof UserPostItem
     */
    voteDirection: NullableOfVoteDirection | null;
    /**
     * 
     * @type {string}
     * @memberof UserPostItem
     */
    coverUrl: string | null;
    /**
     * 
     * @type {boolean}
     * @memberof UserPostItem
     */
    isPublished: boolean;
    /**
     * 
     * @type {Array<TagPostResponse>}
     * @memberof UserPostItem
     */
    tags: Array<TagPostResponse>;
    /**
     * 
     * @type {Date}
     * @memberof UserPostItem
     */
    createdAtUtc: Date;
}



/**
 * Check if a given object implements the UserPostItem interface.
 */
export function instanceOfUserPostItem(value: object): value is UserPostItem {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('title' in value) || value['title'] === undefined) return false;
    if (!('summary' in value) || value['summary'] === undefined) return false;
    if (!('slug' in value) || value['slug'] === undefined) return false;
    if (!('views' in value) || value['views'] === undefined) return false;
    if (!('comments' in value) || value['comments'] === undefined) return false;
    if (!('rating' in value) || value['rating'] === undefined) return false;
    if (!('voteDirection' in value) || value['voteDirection'] === undefined) return false;
    if (!('coverUrl' in value) || value['coverUrl'] === undefined) return false;
    if (!('isPublished' in value) || value['isPublished'] === undefined) return false;
    if (!('tags' in value) || value['tags'] === undefined) return false;
    if (!('createdAtUtc' in value) || value['createdAtUtc'] === undefined) return false;
    return true;
}

export function UserPostItemFromJSON(json: any): UserPostItem {
    return UserPostItemFromJSONTyped(json, false);
}

export function UserPostItemFromJSONTyped(json: any, ignoreDiscriminator: boolean): UserPostItem {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
        'title': json['title'],
        'summary': json['summary'],
        'slug': json['slug'],
        'views': json['views'],
        'comments': json['comments'],
        'rating': json['rating'],
        'voteDirection': NullableOfVoteDirectionFromJSON(json['voteDirection']),
        'coverUrl': json['coverUrl'],
        'isPublished': json['isPublished'],
        'tags': ((json['tags'] as Array<any>).map(TagPostResponseFromJSON)),
        'createdAtUtc': (new Date(json['createdAtUtc'])),
    };
}

export function UserPostItemToJSON(json: any): UserPostItem {
    return UserPostItemToJSONTyped(json, false);
}

export function UserPostItemToJSONTyped(value?: UserPostItem | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
        'title': value['title'],
        'summary': value['summary'],
        'slug': value['slug'],
        'views': value['views'],
        'comments': value['comments'],
        'rating': value['rating'],
        'voteDirection': NullableOfVoteDirectionToJSON(value['voteDirection']),
        'coverUrl': value['coverUrl'],
        'isPublished': value['isPublished'],
        'tags': ((value['tags'] as Array<any>).map(TagPostResponseToJSON)),
        'createdAtUtc': ((value['createdAtUtc']).toISOString()),
    };
}

