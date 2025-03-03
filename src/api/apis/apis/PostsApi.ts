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

import * as runtime from "../runtime";
import type {
  CommentResponse,
  CreatePostRequest,
  NoContent,
  PostDetailedResponse,
  PostResponse,
  ProblemDetails,
  PublishedPostResponse,
  UpdatePostRequest,
  UserPostResponse,
  VoteDirection,
} from "../models/index";
import {
  CommentResponseFromJSON,
  CommentResponseToJSON,
  CreatePostRequestFromJSON,
  CreatePostRequestToJSON,
  NoContentFromJSON,
  NoContentToJSON,
  PostDetailedResponseFromJSON,
  PostDetailedResponseToJSON,
  PostResponseFromJSON,
  PostResponseToJSON,
  ProblemDetailsFromJSON,
  ProblemDetailsToJSON,
  PublishedPostResponseFromJSON,
  PublishedPostResponseToJSON,
  UpdatePostRequestFromJSON,
  UpdatePostRequestToJSON,
  UserPostResponseFromJSON,
  UserPostResponseToJSON,
  VoteDirectionFromJSON,
  VoteDirectionToJSON,
} from "../models/index";

export interface CreatePostOperationRequest {
  createPostRequest: CreatePostRequest;
}

export interface DeletePostRequest {
  id: string;
}

export interface GetAllPostsRequest {
  offset?: number;
}

export interface GetCommentsByPostIdRequest {
  id: string;
}

export interface GetPostByIdRequest {
  id: string;
}

export interface GetPostsBySlugRequest {
  slug: string;
}

export interface GetPostsByTagRequest {
  tag: string;
}

export interface GetPostsByUserNameRequest {
  userName: string;
  offset?: number;
}

export interface HidePostRequest {
  id: string;
}

export interface IncrementViewCountRequest {
  id: string;
}

export interface PublishPostRequest {
  id: string;
}

export interface UpdatePostOperationRequest {
  id: string;
  updatePostRequest: UpdatePostRequest;
}

export interface VotePostRequest {
  id: string;
  direction?: VoteDirection;
}

/**
 * PostsApi - interface
 *
 * @export
 * @interface PostsApiInterface
 */
export interface PostsApiInterface {
  /**
   *
   * @param {CreatePostRequest} createPostRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  createPostRaw(
    requestParameters: CreatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>>;

  /**
   */
  createPost(
    requestParameters: CreatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void>;

  /**
   *
   * @param {string} id
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  deletePostRaw(
    requestParameters: DeletePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>>;

  /**
   */
  deletePost(
    requestParameters: DeletePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void>;

  /**
   *
   * @param {number} [offset]
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  getAllPostsRaw(
    requestParameters: GetAllPostsRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<PublishedPostResponse>>>;

  /**
   */
  getAllPosts(
    requestParameters: GetAllPostsRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<PublishedPostResponse>>;

  /**
   *
   * @param {string} id
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  getCommentsByPostIdRaw(
    requestParameters: GetCommentsByPostIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<CommentResponse>>>;

  /**
   */
  getCommentsByPostId(
    requestParameters: GetCommentsByPostIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<CommentResponse>>;

  /**
   *
   * @param {string} id
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  getPostByIdRaw(
    requestParameters: GetPostByIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<PostResponse>>;

  /**
   */
  getPostById(
    requestParameters: GetPostByIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<PostResponse>;

  /**
   *
   * @param {string} slug
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  getPostsBySlugRaw(
    requestParameters: GetPostsBySlugRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<PostDetailedResponse>>;

  /**
   */
  getPostsBySlug(
    requestParameters: GetPostsBySlugRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<PostDetailedResponse>;

  /**
   *
   * @param {string} tag
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  getPostsByTagRaw(
    requestParameters: GetPostsByTagRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<PublishedPostResponse>>>;

  /**
   */
  getPostsByTag(
    requestParameters: GetPostsByTagRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<PublishedPostResponse>>;

  /**
   *
   * @param {string} userName
   * @param {number} [offset]
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  getPostsByUserNameRaw(
    requestParameters: GetPostsByUserNameRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<UserPostResponse>>;

  /**
   */
  getPostsByUserName(
    requestParameters: GetPostsByUserNameRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<UserPostResponse>;

  /**
   *
   * @param {string} id
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  hidePostRaw(
    requestParameters: HidePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>>;

  /**
   */
  hidePost(
    requestParameters: HidePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void>;

  /**
   *
   * @param {string} id
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  incrementViewCountRaw(
    requestParameters: IncrementViewCountRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>>;

  /**
   */
  incrementViewCount(
    requestParameters: IncrementViewCountRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void>;

  /**
   *
   * @param {string} id
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  publishPostRaw(
    requestParameters: PublishPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>>;

  /**
   */
  publishPost(
    requestParameters: PublishPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void>;

  /**
   *
   * @param {string} id
   * @param {UpdatePostRequest} updatePostRequest
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  updatePostRaw(
    requestParameters: UpdatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>>;

  /**
   */
  updatePost(
    requestParameters: UpdatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void>;

  /**
   *
   * @param {string} id
   * @param {VoteDirection} [direction]
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof PostsApiInterface
   */
  votePostRaw(
    requestParameters: VotePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<NoContent>>;

  /**
   */
  votePost(
    requestParameters: VotePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<NoContent>;
}

/**
 *
 */
export class PostsApi extends runtime.BaseAPI implements PostsApiInterface {
  /**
   */
  async createPostRaw(
    requestParameters: CreatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["createPostRequest"] == null) {
      throw new runtime.RequiredError(
        "createPostRequest",
        'Required parameter "createPostRequest" was null or undefined when calling createPost().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    const response = await this.request(
      {
        path: `/api/posts`,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: CreatePostRequestToJSON(requestParameters["createPostRequest"]),
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async createPost(
    requestParameters: CreatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.createPostRaw(requestParameters, initOverrides);
  }

  /**
   */
  async deletePostRaw(
    requestParameters: DeletePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling deletePost().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{id}`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "DELETE",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async deletePost(
    requestParameters: DeletePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.deletePostRaw(requestParameters, initOverrides);
  }

  /**
   */
  async getAllPostsRaw(
    requestParameters: GetAllPostsRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<PublishedPostResponse>>> {
    const queryParameters: any = {};

    if (requestParameters["offset"] != null) {
      queryParameters["offset"] = requestParameters["offset"];
    }

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts`,
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      jsonValue.map(PublishedPostResponseFromJSON)
    );
  }

  /**
   */
  async getAllPosts(
    requestParameters: GetAllPostsRequest = {},
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<PublishedPostResponse>> {
    const response = await this.getAllPostsRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async getCommentsByPostIdRaw(
    requestParameters: GetCommentsByPostIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<CommentResponse>>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling getCommentsByPostId().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{id}/comments`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      jsonValue.map(CommentResponseFromJSON)
    );
  }

  /**
   */
  async getCommentsByPostId(
    requestParameters: GetCommentsByPostIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<CommentResponse>> {
    const response = await this.getCommentsByPostIdRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async getPostByIdRaw(
    requestParameters: GetPostByIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<PostResponse>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling getPostById().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{id}`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      PostResponseFromJSON(jsonValue)
    );
  }

  /**
   */
  async getPostById(
    requestParameters: GetPostByIdRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<PostResponse> {
    const response = await this.getPostByIdRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async getPostsBySlugRaw(
    requestParameters: GetPostsBySlugRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<PostDetailedResponse>> {
    if (requestParameters["slug"] == null) {
      throw new runtime.RequiredError(
        "slug",
        'Required parameter "slug" was null or undefined when calling getPostsBySlug().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{slug}`.replace(
          `{${"slug"}}`,
          encodeURIComponent(String(requestParameters["slug"]))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      PostDetailedResponseFromJSON(jsonValue)
    );
  }

  /**
   */
  async getPostsBySlug(
    requestParameters: GetPostsBySlugRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<PostDetailedResponse> {
    const response = await this.getPostsBySlugRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async getPostsByTagRaw(
    requestParameters: GetPostsByTagRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<Array<PublishedPostResponse>>> {
    if (requestParameters["tag"] == null) {
      throw new runtime.RequiredError(
        "tag",
        'Required parameter "tag" was null or undefined when calling getPostsByTag().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/t/{tag}`.replace(
          `{${"tag"}}`,
          encodeURIComponent(String(requestParameters["tag"]))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      jsonValue.map(PublishedPostResponseFromJSON)
    );
  }

  /**
   */
  async getPostsByTag(
    requestParameters: GetPostsByTagRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<Array<PublishedPostResponse>> {
    const response = await this.getPostsByTagRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async getPostsByUserNameRaw(
    requestParameters: GetPostsByUserNameRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<UserPostResponse>> {
    if (requestParameters["userName"] == null) {
      throw new runtime.RequiredError(
        "userName",
        'Required parameter "userName" was null or undefined when calling getPostsByUserName().'
      );
    }

    const queryParameters: any = {};

    if (requestParameters["offset"] != null) {
      queryParameters["offset"] = requestParameters["offset"];
    }

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{userName}/posts`.replace(
          `{${"userName"}}`,
          encodeURIComponent(String(requestParameters["userName"]))
        ),
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      UserPostResponseFromJSON(jsonValue)
    );
  }

  /**
   */
  async getPostsByUserName(
    requestParameters: GetPostsByUserNameRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<UserPostResponse> {
    const response = await this.getPostsByUserNameRaw(
      requestParameters,
      initOverrides
    );
    return await response.value();
  }

  /**
   */
  async hidePostRaw(
    requestParameters: HidePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling hidePost().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{id}/hide`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "PUT",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async hidePost(
    requestParameters: HidePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.hidePostRaw(requestParameters, initOverrides);
  }

  /**
   */
  async incrementViewCountRaw(
    requestParameters: IncrementViewCountRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling incrementViewCount().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{id}/count-view`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "PUT",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async incrementViewCount(
    requestParameters: IncrementViewCountRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.incrementViewCountRaw(requestParameters, initOverrides);
  }

  /**
   */
  async publishPostRaw(
    requestParameters: PublishPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling publishPost().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{id}/publish`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "PUT",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async publishPost(
    requestParameters: PublishPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.publishPostRaw(requestParameters, initOverrides);
  }

  /**
   */
  async updatePostRaw(
    requestParameters: UpdatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling updatePost().'
      );
    }

    if (requestParameters["updatePostRequest"] == null) {
      throw new runtime.RequiredError(
        "updatePostRequest",
        'Required parameter "updatePostRequest" was null or undefined when calling updatePost().'
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json";

    const response = await this.request(
      {
        path: `/api/posts/{id}`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "PUT",
        headers: headerParameters,
        query: queryParameters,
        body: UpdatePostRequestToJSON(requestParameters["updatePostRequest"]),
      },
      initOverrides
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async updatePost(
    requestParameters: UpdatePostOperationRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<void> {
    await this.updatePostRaw(requestParameters, initOverrides);
  }

  /**
   */
  async votePostRaw(
    requestParameters: VotePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<runtime.ApiResponse<NoContent>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling votePost().'
      );
    }

    const queryParameters: any = {};

    if (requestParameters["direction"] != null) {
      queryParameters["direction"] = requestParameters["direction"];
    }

    const headerParameters: runtime.HTTPHeaders = {};

    const response = await this.request(
      {
        path: `/api/posts/{id}/vote`.replace(
          `{${"id"}}`,
          encodeURIComponent(String(requestParameters["id"]))
        ),
        method: "PUT",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      NoContentFromJSON(jsonValue)
    );
  }

  /**
   */
  async votePost(
    requestParameters: VotePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ): Promise<NoContent> {
    const response = await this.votePostRaw(requestParameters, initOverrides);
    return await response.value();
  }
}
