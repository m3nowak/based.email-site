//Simple login request class with username, password and public key
export interface LoginRequest {
    username: string;
    password: string;
    publicKey: string;
}
//Simple login response class with genetated text cred
export interface LoginResponse {
    cred: string;
}

export interface DMZResponse {
    creds: string;
    username: string;
}