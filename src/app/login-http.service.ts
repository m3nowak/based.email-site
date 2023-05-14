import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from 'src/env/environment';
import { LoginRequest, LoginResponse } from './models/login-model';

@Injectable({
  providedIn: 'root'
})
export class LoginHttpService {

  constructor(private http: HttpClient) { }
  login(username: string, password: string, publicKey: string): Observable<LoginResponse> {
    const url = `${environment.loginHttpURL}/login`;
    const req: LoginRequest = {
      username,
      password,
      publicKey
    };
    return this.http.post<LoginResponse>(url, req).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.log(error.error);
      return of(error.error); 
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
