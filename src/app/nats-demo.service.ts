import { Injectable } from '@angular/core';

import { AckPolicy, Codec, JetStreamClient, JetStreamManager, JsMsg, NatsConnection, QueuedIterator, StringCodec, connect, jwtAuthenticator} from "nats.ws";
import { Observable } from 'rxjs';

import { environment } from 'src/env/environment';

import { Buffer } from 'buffer';
import { LoginResponse } from './models/login-model';
import { JWTPayload, decodeJwt } from 'jose';

const serverUrl = 'ws://localhost:8080';//"wss://nats.testing.based.email:4443";

interface SubResponse {
  topic: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NatsDemoService {
  private conn: NatsConnection | null = null;
  private sc = StringCodec();

  private jwt: string | null = null;
  private seed: Uint8Array | null = null;
  private _isSetup = false;
  private js: JetStreamClient | null = null;
  private jsm: JetStreamManager | null = null;
  private jwtClaims: JWTPayload | null = null;

  constructor() { 
  }

  async setUp(jwt: string, seed: Uint8Array): Promise<void> {
    this.jwt = jwt;
    this.seed = seed;
    this._isSetup = true;
  }

  get stringCodec(): Codec<string> {
    return this.sc;
  }

  get isSetup(): boolean {
    return this._isSetup;
  }

  get username(): string | null{
    let name = this.jwtClaims!['name'];
    if (typeof name === 'string') {
      return name;
    }
    else { return null; }
    
  }

  private async ensureConnect(): Promise<void> {
    if (!this._isSetup) {
      throw new Error("Not setup");
    }
    if (!this.conn) {
      this.jwtClaims = decodeJwt(this.jwt!);
      this.conn = await connect({ servers: serverUrl, authenticator: jwtAuthenticator(this.jwt!, this.seed!), inboxPrefix: `_INBOX.${this.jwtClaims['name']}` });
      this.js = this.conn.jetstream();
      this.jsm = await this.conn.jetstreamManager();
    }
  }

  async pub(subject: string, data: string): Promise<void> {
    await this.ensureConnect();
    const encoder = new TextEncoder();
    this.conn!.publish(subject, encoder.encode(data));
  }

  async sub(subject: string): Promise<Observable<SubResponse>> {
    await this.ensureConnect();
    const observable = new Observable<SubResponse>((subscriber) => {
      const sub = this.conn!.subscribe(subject);
      (async () => {
        for await (const m of sub) {
          console.log(`[${m.subject}] ${m.data}`);
          subscriber.next({
            topic: m.subject,
            message: this.sc.decode(m.data)
          });
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

  async stream_process_async(streamName: string): Promise<QueuedIterator<JsMsg>> {
    await this.ensureConnect();
    const sc = StringCodec();
    //generate random uuid    
    let cinfo = await this.jsm?.consumers.add(streamName, {ack_policy: AckPolicy.Explicit, inactive_threshold: 10000});
    console.log(cinfo!.name);
    return this.js!.fetch(streamName, cinfo!.name, {batch:100, expires: 10000});
  }

  async stream_process(streamName: string): Promise<Observable<string>> {
    let streamFetch = await this.stream_process_async(streamName);

    const observable = new Observable<string>((subscriber) => {
      let asw = (async () => {
        for await (const m of streamFetch) {
          console.log(`[${m.subject}] ${m.data}`);
          subscriber.next(this.sc.decode(m.data));
          m.ack();
        }
      })();
    });

    return new Promise(resolve => {
        resolve(observable);
      });
  }

  
}
