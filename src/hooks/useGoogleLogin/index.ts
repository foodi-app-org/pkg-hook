import { useState, useEffect } from 'react'

import loadScript from './loadScript'
import removeScript from './removeScript'

// Extend globalThis to include gapi
declare global {
  interface GapiAuth2 {
    getAuthInstance: () => any;
    init: (params: any) => Promise<any>;
  }
  interface Gapi {
    auth2: GapiAuth2;
    load: (name: string, callback: () => void) => void;
  }
  interface Window {
    gapi: Gapi;
  }
  var gapi: Gapi;
}

type UseGoogleLoginParams = {
  onSuccess?: (res: any) => void;
  onAutoLoadFinished?: (signedIn?: boolean) => void;
  onFailure?: (err?: any) => void;
  onRequest?: () => void;
  onScriptLoadFailure?: (err?: any) => void;
  clientId?: string;
  cookiePolicy?: string;
  loginHint?: string;
  hostedDomain?: string;
  autoLoad?: boolean;
  isSignedIn?: boolean;
  fetchBasicProfile?: boolean;
  redirectUri?: string;
  discoveryDocs?: string[];
  uxMode?: string;
  scope?: string;
  accessType?: string;
  responseType?: string;
  jsSrc?: string;
  prompt?: string;
};

export const useGoogleLogin = ({
  onSuccess = () => { },
  onAutoLoadFinished = () => { },
  onFailure = () => { },
  onRequest = () => { },
  onScriptLoadFailure,
  clientId,
  cookiePolicy,
  loginHint,
  hostedDomain,
  autoLoad,
  isSignedIn,
  fetchBasicProfile,
  redirectUri,
  discoveryDocs,
  uxMode,
  scope,
  accessType,
  responseType,
  jsSrc = 'https://apis.google.com/js/api.js',
  prompt
}: UseGoogleLoginParams) => {
  const [loaded, setLoaded] = useState(false)

  /**
   *
   * @param res
   */
  function handleSigninSuccess(res: any) {
    /*
      offer renamed response keys to names that match use
    */
    const basicProfile = res.getBasicProfile()
    const authResponse = res.getAuthResponse(true)
    res.googleId = basicProfile.getId()
    res.tokenObj = authResponse
    res.tokenId = authResponse.id_token
    res.accessToken = authResponse.access_token
    res.profileObj = {
      googleId: basicProfile.getId(),
      imageUrl: basicProfile.getImageUrl(),
      email: basicProfile.getEmail(),
      name: basicProfile.getName(),
      givenName: basicProfile.getGivenName(),
      familyName: basicProfile.getFamilyName()
    }
    if (typeof onSuccess === 'function') onSuccess(res)
  }

  /**
   *
   * @param e
   */
  function signIn(e?: React.MouseEvent<HTMLButtonElement> | Event) {
    if (e) {
      e.preventDefault(); // to prevent submit if used within form
    }
    if (loaded) {
      const GoogleAuth = globalThis.gapi.auth2.getAuthInstance();
      const options = {
        prompt
      };
      if (typeof onRequest === 'function') onRequest();
      if (responseType === 'code') {
        GoogleAuth.grantOfflineAccess(options).then(
          (res: any) => { return typeof onSuccess === 'function' && onSuccess(res); },
          (err: any) => { return typeof onFailure === 'function' && onFailure(err); }
        );
      } else {
        GoogleAuth.signIn(options).then(
          (res: any) => { return handleSigninSuccess(res); },
          (err: any) => { return typeof onFailure === 'function' && onFailure(err); }
        );
      }
    }
  }

  useEffect(() => {
    let unmounted = false
    const onLoadFailure = onScriptLoadFailure || onFailure
    loadScript(
      document,
      'script',
      'google-login',
      jsSrc,
      () => {
        interface AuthInitParams {
          client_id?: string;
          cookie_policy?: string;
          login_hint?: string;
          hosted_domain?: string;
          fetch_basic_profile?: boolean;
          discoveryDocs?: string[];
          ux_mode?: string;
          redirect_uri?: string;
          scope?: string;
          access_type?: string;
        }

        interface GoogleAuthIsSignedIn {
          get: () => boolean;
        }

        interface GoogleAuthCurrentUser {
          get: () => any;
        }

        interface GoogleAuthInstance {
          isSignedIn: GoogleAuthIsSignedIn;
          currentUser: GoogleAuthCurrentUser;
          signIn: (options?: { prompt?: string }) => Promise<any>;
          grantOfflineAccess: (options?: { prompt?: string }) => Promise<any>;
          then: (onFulfilled: () => void, onRejected?: (err: any) => void) => void;
        }

        const params: AuthInitParams = {
          client_id: clientId,
          cookie_policy: cookiePolicy,
          login_hint: loginHint,
          hosted_domain: hostedDomain,
          fetch_basic_profile: fetchBasicProfile,
          discoveryDocs,
          ux_mode: uxMode,
          redirect_uri: redirectUri,
          scope,
          access_type: accessType
        }

        if (responseType === 'code') {
          params.access_type = 'offline'
        }

        globalThis.gapi.load('auth2', () => {
          const GoogleAuth = globalThis.gapi.auth2.getAuthInstance() as GoogleAuthInstance | undefined;
          const handleAuthInit = (res: GoogleAuthInstance) => {
            if (!unmounted) {
              setLoaded(true);
              const signedIn: boolean | undefined = isSignedIn && res.isSignedIn.get()
              if (typeof onAutoLoadFinished === 'function') onAutoLoadFinished(signedIn);
              if (signedIn) {
                handleSigninSuccess(res.currentUser.get());
              }
            }
          };
          const handleAuthError = (err: any) => {
            setLoaded(true);
            if (typeof onAutoLoadFinished === 'function') onAutoLoadFinished(false);
            if (typeof onLoadFailure === 'function') onLoadFailure(err);
          };
          if (GoogleAuth) {
            GoogleAuth.then(
              () => {
                if (unmounted) {
                  return;
                }
                if (isSignedIn && GoogleAuth.isSignedIn.get()) {
                  setLoaded(true);
                  if (typeof onAutoLoadFinished === 'function') onAutoLoadFinished(true);
                  handleSigninSuccess(GoogleAuth.currentUser.get());
                } else {
                  setLoaded(true);
                  if (typeof onAutoLoadFinished === 'function') onAutoLoadFinished(false);
                }
              },
              (err: any) => {
                if (typeof onFailure === 'function') onFailure(err);
              }
            );
          } else {
            globalThis.gapi.auth2.init(params).then(handleAuthInit, handleAuthError);
          }
        });
      },
      (err: any) => {
        onLoadFailure(err)
      }
    )

    return () => {
      unmounted = true
      removeScript(document, 'google-login')
    }
  }, [])

  useEffect(() => {
    if (autoLoad) {
      signIn(undefined)
    }
  }, [loaded])

  return { signIn, loaded }
}
