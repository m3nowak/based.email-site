import { Injectable } from '@angular/core';

import { NatsConnection, StringCodec, connect, credsAuthenticator } from "nats.ws";
import { Observable } from 'rxjs';

const serverUrl = "wss://nats.testing.based.email:4443";

@Injectable({
  providedIn: 'root'
})
export class NatsDemoService {
  private conn: NatsConnection | undefined = undefined;

  constructor() { 
  }

  private async getJWT(): Promise<string> {
    /** Get jwt from local file */
    return await fetch('assets/admin.creds').then(response => response.text());
  }

  async connect(): Promise<void> {
    if (!this.conn) {
      this.conn = await connect({ servers: serverUrl, authenticator: credsAuthenticator(new TextEncoder().encode(await this.getJWT())) });
    }
  }

  async publish(subject: string, data: string): Promise<void> {
    if (!this.conn) {
      throw new Error("Not connected");
    }
    const encoder = new TextEncoder();
    this.conn.publish(subject, encoder.encode(data));
  }

  async subscribe(subject: string): Promise<Observable<string>> {
    if (!this.conn) {
      await this.connect();
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


    return  new Promise(resolve => {
        resolve(observable);
      });
  }
  
}
