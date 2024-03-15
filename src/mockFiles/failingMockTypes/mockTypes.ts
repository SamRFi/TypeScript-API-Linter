// src/tests/mockTypes/signInTypes.ts

export interface SignInRequestBody {
  emails: string;
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