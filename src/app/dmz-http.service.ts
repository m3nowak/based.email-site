import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/env/environment';
import { DMZResponse } from './models/login-model';

@Injectable({
  providedIn: 'root'
})
export class DmzHttpService {

  constructor(private http: HttpClient) { }

  getCreds(): Observable<any> {
    const url = `${environment.dmzHttpURL}/creds`; // replace with your POST endpoint
    return this.http.post<DMZResponse>(url, '');
  }
}
