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


import * as runtime from '../runtime';
import type {
  MediaItemResponse,
  ProblemDetails,
} from '../models/index';
import {
    MediaItemResponseFromJSON,
    MediaItemResponseToJSON,
    ProblemDetailsFromJSON,
    ProblemDetailsToJSON,
} from '../models/index';

export interface ListMediaRequest {
    userId: string;
}

export interface UploadMediaRequest {
    id: string;
    file?: Blob;
}

/**
 * MediaApi - interface
 * 
 * @export
 * @interface MediaApiInterface
 */
export interface MediaApiInterface {
    /**
     * 
     * @param {string} userId 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MediaApiInterface
     */
    listMediaRaw(requestParameters: ListMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<MediaItemResponse>>>;

    /**
     */
    listMedia(requestParameters: ListMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<MediaItemResponse>>;

    /**
     * 
     * @param {string} id 
     * @param {Blob} [file] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof MediaApiInterface
     */
    uploadMediaRaw(requestParameters: UploadMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<string>>;

    /**
     */
    uploadMedia(requestParameters: UploadMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<string>;

}

/**
 * 
 */
export class MediaApi extends runtime.BaseAPI implements MediaApiInterface {

    /**
     */
    async listMediaRaw(requestParameters: ListMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<MediaItemResponse>>> {
        if (requestParameters['userId'] == null) {
            throw new runtime.RequiredError(
                'userId',
                'Required parameter "userId" was null or undefined when calling listMedia().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/api/media/{userId}/list`.replace(`{${"userId"}}`, encodeURIComponent(String(requestParameters['userId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(MediaItemResponseFromJSON));
    }

    /**
     */
    async listMedia(requestParameters: ListMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<MediaItemResponse>> {
        const response = await this.listMediaRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     */
    async uploadMediaRaw(requestParameters: UploadMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<string>> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling uploadMedia().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const consumes: runtime.Consume[] = [
            { contentType: 'multipart/form-data' },
        ];
        // @ts-ignore: canConsumeForm may be unused
        const canConsumeForm = runtime.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): any };
        let useForm = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        useForm = canConsumeForm;
        if (useForm) {
            formParams = new FormData();
        } else {
            formParams = new URLSearchParams();
        }

        if (requestParameters['file'] != null) {
            formParams.append('file', requestParameters['file'] as any);
        }

        const response = await this.request({
            path: `/api/media/{id}/upload`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id']))),
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: formParams,
        }, initOverrides);

        if (this.isJsonMime(response.headers.get('content-type'))) {
            return new runtime.JSONApiResponse<string>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     */
    async uploadMedia(requestParameters: UploadMediaRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<string> {
        const response = await this.uploadMediaRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
