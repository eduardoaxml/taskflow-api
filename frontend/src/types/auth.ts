export interface TokenPair {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}
