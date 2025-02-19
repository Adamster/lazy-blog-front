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


/**
 * 
 * @export
 */
export const VoteDirection = {
    Up: 'Up',
    Down: 'Down'
} as const;
export type VoteDirection = typeof VoteDirection[keyof typeof VoteDirection];


export function instanceOfVoteDirection(value: any): boolean {
    for (const key in VoteDirection) {
        if (Object.prototype.hasOwnProperty.call(VoteDirection, key)) {
            if (VoteDirection[key as keyof typeof VoteDirection] === value) {
                return true;
            }
        }
    }
    return false;
}

export function VoteDirectionFromJSON(json: any): VoteDirection {
    return VoteDirectionFromJSONTyped(json, false);
}

export function VoteDirectionFromJSONTyped(json: any, ignoreDiscriminator: boolean): VoteDirection {
    return json as VoteDirection;
}

export function VoteDirectionToJSON(value?: VoteDirection | null): any {
    return value as any;
}

export function VoteDirectionToJSONTyped(value: any, ignoreDiscriminator: boolean): VoteDirection {
    return value as VoteDirection;
}

