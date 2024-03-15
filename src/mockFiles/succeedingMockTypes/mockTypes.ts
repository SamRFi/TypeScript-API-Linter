// src/tests/mockTypes/signInTypes.ts
//mock test assertion so suite doesn't fail

export interface SignInRequestBody {
    email: string;
    password: string;
    stay_logged_in: boolean;
  }
  
  export interface SignInResponseBody {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
    };
  }