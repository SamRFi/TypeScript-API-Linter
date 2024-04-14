

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

  export interface RegisterRequestBody {
    email: string;
    password: string;
    name: string;
    phone_number: string;
  }
  
  export interface RegisterResponseBody {
    id: string;
    email: string;
    name: string;
    phone_number: string;
  }
  
  export interface ProfileRequestBody {}
  
  export interface ProfileResponseBody {
    id: string;
    email: string;
    name: string;
    phone_number: string;
  }
  
  
  export interface NewCategoryRequestBody {
    name: {
      EN: string;
    };
  }
  
  export interface NewCategoryResponseBody {
    id: string;
    name: {
      EN: string;
    };
  }
  
  export interface UpdateCategoryRequestBody {
    name?: {
      EN: string;
    };
    display_order?: number;
  }
  
  export interface UpdateCategoryResponseBody {
    id: string;
    name: {
      EN: string;
    };
    display_order: number;
  }
  
  export interface DeleteCategoryRequestBody {}
  
  export interface DeleteCategoryResponseBody {}
  
  // src/types/subcategoryTypes.ts
  
  export interface NewSubcategoryRequestBody {
    name: {
      en: string;
    };
  }
  
  export interface NewSubcategoryResponseBody {
    id: string;
    name: {
      EN: string;
    };
  }
  
  export interface UpdateSubcategoryRequestBody {
    name?: {
      EN: string;
    };
    display_order?: number;
  }
  
  export interface UpdateSubcategoryResponseBody {
    id: string;
    name: {
      EN: string;
    };
    display_order: number;
  }
  
  export interface DeleteSubcategoryRequestBody {}
  
  export interface DeleteSubcategoryResponseBody {}
  