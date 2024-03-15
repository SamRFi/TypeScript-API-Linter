// src/tests/mockTypes/signInTypes.ts
//mock test assertion so suite doesn't fail
test('mock test', () => {
    expect(1).toBe(1);
  });

export interface SignInRequestBody {
  emails: number;
  password: string;
}
  
  export interface SignInResponseBody {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
    };
  }