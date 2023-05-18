import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NatsDemoService } from './nats-demo.service';
import { LoginHttpService } from './login-http.service';
import { createUser, fromSeed } from 'nkeys.js';
import { Buffer } from 'buffer';
import { decodeJwt } from 'jose';
import { millis } from 'nats.ws';
import { DateTime } from "luxon";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'based-email-site';
  msgs: string[] = [];
  creds: string = '';
  username: string = '';
  jwt: string | null = null;
  seed: string | null = null;

  subs = [];

  usernameFc = new FormControl('');
  passwordFc = new FormControl('');

  pubDataFc = new FormControl('');


  constructor(private natsDemoService: NatsDemoService, private loginHttpService: LoginHttpService) {
  }
  ngOnInit() {
    this.jwt = localStorage.getItem('jwt');
    this.validateJwt();
    this.seed = localStorage.getItem('seed');
    if (this.seed == null) {
      let user = createUser();
      this.seed = Buffer.from(user.getSeed()).toString('base64')
      localStorage.setItem('seed', this.seed);
    }
  }

  validateJwt() {
    if (this.jwt != null) {
      const claims = decodeJwt(this.jwt);
      console.log(claims.exp, Date.now() / 1000);
      if (claims.exp != undefined && claims.exp < Date.now() / 1000) {
        this.jwt = null;
      }
    }
  }

  publishData() {
    if (this.jwt != null) {
      if (this.pubDataFc.value !== null && this.pubDataFc.value !== '') {
        console.log(`pub  ${this.pubDataFc.value}`);
        Promise.resolve(this.natsDemoService.pub(`chat.${this.natsDemoService.username}`, this.pubDataFc.value));
        this.pubDataFc.setValue('');
      }
    }
  }

  async getMessages() {
    if (this.natsDemoService.isSetup){
      let msgs = await this.natsDemoService.stream_process_async("chat-history");
      const done = (async () => {
        for await (const m of msgs) {
          let dtf = DateTime.fromMillis(m.info.timestampNanos / 1000000).setZone("UTC").toLocal().toFormat('yyyy-MM-dd HH:mm:ss');
          this.msgs.push(this.mkChatEntry(
            this.natsDemoService.stringCodec.decode(m.data),
            m.subject.split('.')[1],
            dtf
          ));
          m.ack();
        }
      })();
      // The iterator completed
      await done;
    }
  }

  natsSvcSetup() {
    if (this.seed != null && this.jwt != null) {
      const seed_raw = new Uint8Array(Buffer.from(this.seed, 'base64'));
      this.natsDemoService.setUp(this.jwt!, seed_raw);
    }
  }

  mkChatEntry(msg: string, username: string, dateTime:string):string {
    return `[${dateTime}] ${username}: ${msg}`
  }

  logout() {
    this.jwt = null;
    localStorage.removeItem('jwt');
  }

  tryLogin() {
    console.log('tryLogin');
    if (this.seed != null) {
      console.log('tryLogin seed');
      if (this.usernameFc.value !== null && this.passwordFc.value !== null) {
        const seed_raw = new Uint8Array(Buffer.from(this.seed, 'base64'));
        let user = fromSeed(seed_raw);
        this.loginHttpService.login(this.usernameFc.value, this.passwordFc.value, user.getPublicKey()).subscribe((msg) => {
          if (msg.success) {
            this.jwt = msg.jwt;
            this.passwordFc.setValue('');
            this.msgs = [];
            localStorage.setItem('jwt', this.jwt!);
            console.log(msg.jwt);
            this.validateJwt();
            this.natsSvcSetup();
            console.log('tryLogin success');
            Promise.resolve(this.getMessages());
            console.log('messages got');
            Promise.resolve(this.natsDemoService.sub(`chat.*`).then((sub) => {
              sub.forEach((msg) => {
                console.log(msg);
                let chatInput = `${msg.topic.split('.')[1]}: ${msg.message}`;
                this.msgs.push(this.mkChatEntry(
                  msg.message,
                  msg.topic.split('.')[1],
                  DateTime.now().toLocal().toFormat('yyyy-MM-dd HH:mm:ss')
                ));
              });
            }));
          }
          else {
            this.passwordFc.setErrors({ 'invalid': true });
          }
        });
      }
    }
  }
}
