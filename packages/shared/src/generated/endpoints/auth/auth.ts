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
export const postAuthLogin = (
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
  


export const getPostAuthLoginMutationOptions = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postAuthLogin>>, TError,{data: LoginRequest}, TContext>, request?: SecondParameter<typeof mutator>}
): UseMutationOptions<Awaited<ReturnType<typeof postAuthLogin>>, TError,{data: LoginRequest}, TContext> => {

const mutationKey = ['postAuthLogin'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postAuthLogin>>, {data: LoginRequest}> = (props) => {
          const {data} = props ?? {};

          return  postAuthLogin(data,requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type PostAuthLoginMutationResult = NonNullable<Awaited<ReturnType<typeof postAuthLogin>>>
    export type PostAuthLoginMutationBody = LoginRequest
    export type PostAuthLoginMutationError = HTTPValidationError

    /**
 * @summary Login
 */
export const usePostAuthLogin = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postAuthLogin>>, TError,{data: LoginRequest}, TContext>, request?: SecondParameter<typeof mutator>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof postAuthLogin>>,
        TError,
        {data: LoginRequest},
        TContext
      > => {

      const mutationOptions = getPostAuthLoginMutationOptions(options);

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
export const postAuthChangePassword = (
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
  


export const getPostAuthChangePasswordMutationOptions = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postAuthChangePassword>>, TError,{data: ChangePasswordRequest}, TContext>, request?: SecondParameter<typeof mutator>}
): UseMutationOptions<Awaited<ReturnType<typeof postAuthChangePassword>>, TError,{data: ChangePasswordRequest}, TContext> => {

const mutationKey = ['postAuthChangePassword'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postAuthChangePassword>>, {data: ChangePasswordRequest}> = (props) => {
          const {data} = props ?? {};

          return  postAuthChangePassword(data,requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type PostAuthChangePasswordMutationResult = NonNullable<Awaited<ReturnType<typeof postAuthChangePassword>>>
    export type PostAuthChangePasswordMutationBody = ChangePasswordRequest
    export type PostAuthChangePasswordMutationError = HTTPValidationError

    /**
 * @summary Change Password
 */
export const usePostAuthChangePassword = <TError = HTTPValidationError,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postAuthChangePassword>>, TError,{data: ChangePasswordRequest}, TContext>, request?: SecondParameter<typeof mutator>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof postAuthChangePassword>>,
        TError,
        {data: ChangePasswordRequest},
        TContext
      > => {

      const mutationOptions = getPostAuthChangePasswordMutationOptions(options);

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
export const postAuthLogout = (
    
 options?: SecondParameter<typeof mutator>,signal?: AbortSignal
) => {
      
      
      return mutator<ApiResponse>(
      {url: `http://localhost:8000/api/v1/auth/logout`, method: 'POST', signal
    },
      options);
    }
  


export const getPostAuthLogoutMutationOptions = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postAuthLogout>>, TError,void, TContext>, request?: SecondParameter<typeof mutator>}
): UseMutationOptions<Awaited<ReturnType<typeof postAuthLogout>>, TError,void, TContext> => {

const mutationKey = ['postAuthLogout'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};

      


      const mutationFn: MutationFunction<Awaited<ReturnType<typeof postAuthLogout>>, void> = () => {
          

          return  postAuthLogout(requestOptions)
        }

        


  return  { mutationFn, ...mutationOptions }}

    export type PostAuthLogoutMutationResult = NonNullable<Awaited<ReturnType<typeof postAuthLogout>>>
    
    export type PostAuthLogoutMutationError = unknown

    /**
 * @summary Logout
 */
export const usePostAuthLogout = <TError = unknown,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof postAuthLogout>>, TError,void, TContext>, request?: SecondParameter<typeof mutator>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof postAuthLogout>>,
        TError,
        void,
        TContext
      > => {

      const mutationOptions = getPostAuthLogoutMutationOptions(options);

      return useMutation(mutationOptions );
    }
    