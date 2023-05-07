import { Injectable } from '@angular/core';

import { Msg, NatsConnection, StringCodec, connect, credsAuthenticator, jwtAuthenticator } from "nats.ws";
import { Observable } from 'rxjs';

import { environment } from 'src/env/environment';

import { Buffer } from 'buffer';
import { LoginResponse } from './models/login-model';

const serverUrl = 'ws://localhost:8080';//"wss://nats.testing.based.email:4443";

@Injectable({
  providedIn: 'root'
})
export class NatsDemoService {
  private conn: NatsConnection | undefined = undefined;
  private sc = StringCodec();

  constructor() { 
  }

  async connect(username: string, creds: string): Promise<void> {
    if (!this.conn) {
      this.conn = await connect({ servers: serverUrl, authenticator: credsAuthenticator(this.sc.encode(creds)), inboxPrefix: `_INBOX.${username}` });
      // this.conn = await connect({ servers: serverUrl, authenticator: jwtAuthenticator(await this.getJWT()) });
    }
  }

  async login(username: string, creds: string): Promise<string> {
    if (!this.conn) {
      await this.connect(username, creds);
    }
    //generate login request
    const loginRequest = "hello!"
    return this.conn!.request('dmz.login', this.sc.encode(JSON.stringify(loginRequest)), { timeout: 1000 }).then((msg) => {
      return Promise.resolve(this.sc.decode(msg.data));
    });
  }

  async publish(subject: string, data: string): Promise<void> {
    if (!this.conn) {
      throw new Error("Not connected");
    }
    const encoder = new TextEncoder();
    this.conn.publish(subject, encoder.encode(data));
  }

  async subscribe(username: string, creds: string, subject: string): Promise<Observable<string>> {
    if (!this.conn) {
      await this.connect(username, creds);
    }
    const sc = StringCodec();
    const observable = new Observable<string>((subscriber) => {
      const sub = this.conn!.subscribe(subject);
      (async () => {
        for await (const m of sub) {
          console.log(`[${m.subject}] ${m.data}`);
          subscriber.next(sc.decode(m.data));
        }
      })();});


    return new Promise(resolve => {
        resolve(observable);
      });
  }
  
}
