import { Injectable } from '@angular/core';

import { NatsConnection, StringCodec, connect, jwtAuthenticator} from "nats.ws";
import { Observable } from 'rxjs';

import { environment } from 'src/env/environment';

import { Buffer } from 'buffer';
import { LoginResponse } from './models/login-model';
import { decodeJwt,  } from 'jose';

const serverUrl = 'ws://localhost:8080';//"wss://nats.testing.based.email:4443";

@Injectable({
  providedIn: 'root'
})
export class NatsDemoService {
  private conn: NatsConnection | null = null;
  private sc = StringCodec();

  private jwt: string | null = null;
  private seed: Uint8Array | null = null;
  private isSetup = false;

  constructor() { 
  }

  async setUp(jwt: string, seed: Uint8Array): Promise<void> {
    this.jwt = jwt;
    this.seed = seed;
    this.isSetup = true;
  }

  private async ensureConnect(): Promise<void> {
    if (!this.isSetup) {
      throw new Error("Not setup");
    }
    if (!this.conn) {
      const claims = decodeJwt(this.jwt!);
      this.conn = await connect({ servers: serverUrl, authenticator: jwtAuthenticator(this.jwt!, this.seed!), inboxPrefix: `_INBOX.${claims['name']}` });
    }
  }

  async pub(subject: string, data: string): Promise<void> {
    await this.ensureConnect();
    const encoder = new TextEncoder();
    this.conn!.publish(subject, encoder.encode(data));
  }

  async sub(subject: string): Promise<Observable<string>> {
    await this.ensureConnect();
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

  async req(subject: string, data: string): Promise<string> {
    await this.ensureConnect();
    return this.conn!.request(subject, this.sc.encode(data), { timeout: 1000 }).then((msg) => {
      return Promise.resolve(this.sc.decode(msg.data));
    });
  }
  
}
