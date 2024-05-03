

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
    password?: string; // Optional properties
    state?: string;
    role?: string;
    preferences?: Preference; // Object with any properties
  }

  export interface UserPreference {
    userId: string;
    preferences: {
      theme: string;
      language: string;
      notifications: boolean;
    };
  }

  export interface UserPreferenceResponseBody {
    userId: string;
    preferences: {
      theme: string;
      language: string;
      notifications: boolean;
    };
  }

  export interface Preference {
    theme: string;
    language: string;
  }
  
  export interface CreateCategoryRequestBody {
    name: {
      en: string;
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
    category_id: string; // Include missing property
    name: {
      EN: string;
    };
    display_order: number; // Include missing property
  }
  export interface UpdateSubcategoryRequestBody {
    name?: {
      EN: string;
    };
    display_order?: number;
  }
  
  export interface UpdateSubcategoryResponseBody {
    id: string;
    category_id: string; // Include missing property
    name: {
      EN: string;
    };
    display_order: number;
  }
  
  export interface DeleteSubcategoryRequestBody {}
  
  export interface DeleteSubcategoryResponseBody {}
  