export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}
