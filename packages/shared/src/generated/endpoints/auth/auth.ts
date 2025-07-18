/**
 * // 🚀 Auto-generated by Orval (Axios + React Query)
 * // 🔄 Do not edit manually - regenerate with: pnpm generate-types
 * // 📁 Organized by FastAPI tags for maximum maintainability
 * // 🔐 Uses custom Axios instance with auth & error handling
 * 
 */
import {
  useMutation
} from '@tanstack/react-query';
import type {
  MutationFunction,
  UseMutationOptions,
  UseMutationResult
} from '@tanstack/react-query';

import type {
  ApiResponse,
  AuthToken,
  ChangePasswordRequest,
  HTTPValidationError,
  LoginRequest
} from '../../schemas';

import { mutator } from '../../../../../../apps/web/src/lib/api';

type AwaitedInput<T> = PromiseLike<T> | T;

      type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;


type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];



/**
 * Login endpoint - authenticate user and return JWT token.

This endpoint:
1. Validates user credentials against the database
2. Checks if the user account is active
3. Generates a secure JWT token
4. Returns token with expiration info
 * @summary Login
 */
export const Login_api_v1_auth_login_post = (
    loginRequest: LoginRequest,
 options?: SecondParameter<typeof mutator>,signal?: AbortSignal
) => {
      
      
      return mutator<AuthToken>(
      {url: `http://localhost:8000/api/v1/auth/login`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: loginRequest, signal
    },
      options);
    }
  


export const getLoginApiV1AuthLoginPostMutationOptions = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof Login_api_v1_auth_login_post>>, TError,{data: LoginRequest}, TContext>, request?: SecondParameter<typeof mutator>}
): UseMutationOptions<Awaited<ReturnType<typeof Login_api_v1_auth_login_post>>, TError,{data: LoginRequest}, TContext> => {

const mutationKey = ['loginApiV1AuthLoginPost'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof Login_api_v1_auth_login_post>>, {data: LoginRequest}> = (props) => {
          const {data} = props ?? {};

          return  Login_api_v1_auth_login_post(data,requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type LoginApiV1AuthLoginPostMutationResult = NonNullable<Awaited<ReturnType<typeof Login_api_v1_auth_login_post>>>
    export type LoginApiV1AuthLoginPostMutationBody = LoginRequest
    export type LoginApiV1AuthLoginPostMutationError = HTTPValidationError

    /**
 * @summary Login
 */
export const useLoginApiV1AuthLoginPost = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof Login_api_v1_auth_login_post>>, TError,{data: LoginRequest}, TContext>, request?: SecondParameter<typeof mutator>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof Login_api_v1_auth_login_post>>,
        TError,
        {data: LoginRequest},
        TContext
      > => {

      const mutationOptions = getLoginApiV1AuthLoginPostMutationOptions(options);

      return useMutation(mutationOptions );
    }
    /**
 * Change user password endpoint.

This endpoint:
1. Verifies the current password
2. Updates the user's password
3. Sets must_change_password to False
4. Returns success message
 * @summary Change Password
 */
export const Change_password_api_v1_auth_change_password_post = (
    changePasswordRequest: ChangePasswordRequest,
 options?: SecondParameter<typeof mutator>,signal?: AbortSignal
) => {
      
      
      return mutator<ApiResponse>(
      {url: `http://localhost:8000/api/v1/auth/change-password`, method: 'POST',
      headers: {'Content-Type': 'application/json', },
      data: changePasswordRequest, signal
    },
      options);
    }
  


export const getChangePasswordApiV1AuthChangePasswordPostMutationOptions = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof Change_password_api_v1_auth_change_password_post>>, TError,{data: ChangePasswordRequest}, TContext>, request?: SecondParameter<typeof mutator>}
): UseMutationOptions<Awaited<ReturnType<typeof Change_password_api_v1_auth_change_password_post>>, TError,{data: ChangePasswordRequest}, TContext> => {

const mutationKey = ['changePasswordApiV1AuthChangePasswordPost'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof Change_password_api_v1_auth_change_password_post>>, {data: ChangePasswordRequest}> = (props) => {
          const {data} = props ?? {};

          return  Change_password_api_v1_auth_change_password_post(data,requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type ChangePasswordApiV1AuthChangePasswordPostMutationResult = NonNullable<Awaited<ReturnType<typeof Change_password_api_v1_auth_change_password_post>>>
    export type ChangePasswordApiV1AuthChangePasswordPostMutationBody = ChangePasswordRequest
    export type ChangePasswordApiV1AuthChangePasswordPostMutationError = HTTPValidationError

    /**
 * @summary Change Password
 */
export const useChangePasswordApiV1AuthChangePasswordPost = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof Change_password_api_v1_auth_change_password_post>>, TError,{data: ChangePasswordRequest}, TContext>, request?: SecondParameter<typeof mutator>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof Change_password_api_v1_auth_change_password_post>>,
        TError,
        {data: ChangePasswordRequest},
        TContext
      > => {

      const mutationOptions = getChangePasswordApiV1AuthChangePasswordPostMutationOptions(options);

      return useMutation(mutationOptions );
    }
    /**
 * Logout endpoint - invalidate user session.

In production, this will:
1. Blacklist the JWT token
2. Clear any session data
3. Log the logout event
 * @summary Logout
 */
export const Logout_api_v1_auth_logout_post = (
    
 options?: SecondParameter<typeof mutator>,signal?: AbortSignal
) => {
      
      
      return mutator<ApiResponse>(
      {url: `http://localhost:8000/api/v1/auth/logout`, method: 'POST', signal
    },
      options);
    }
  


export const getLogoutApiV1AuthLogoutPostMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof Logout_api_v1_auth_logout_post>>, TError,void, TContext>, request?: SecondParameter<typeof mutator>}
): UseMutationOptions<Awaited<ReturnType<typeof Logout_api_v1_auth_logout_post>>, TError,void, TContext> => {

const mutationKey = ['logoutApiV1AuthLogoutPost'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof Logout_api_v1_auth_logout_post>>, void> = () => {
          

          return  Logout_api_v1_auth_logout_post(requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type LogoutApiV1AuthLogoutPostMutationResult = NonNullable<Awaited<ReturnType<typeof Logout_api_v1_auth_logout_post>>>
    
    export type LogoutApiV1AuthLogoutPostMutationError = unknown

    /**
 * @summary Logout
 */
export const useLogoutApiV1AuthLogoutPost = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof Logout_api_v1_auth_logout_post>>, TError,void, TContext>, request?: SecondParameter<typeof mutator>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof Logout_api_v1_auth_logout_post>>,
        TError,
        void,
        TContext
      > => {

      const mutationOptions = getLogoutApiV1AuthLogoutPostMutationOptions(options);

      return useMutation(mutationOptions );
    }
    