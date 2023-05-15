import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NatsDemoService } from './nats-demo.service';
import { LoginHttpService } from './login-http.service';
import { createUser, fromSeed } from 'nkeys.js';
import { Buffer } from 'buffer';
import { decodeJwt } from 'jose';

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

  usernameFc = new FormControl('');
  passwordFc = new FormControl('');

  pubTopicFc = new FormControl('');
  pubDataFc = new FormControl('');


  constructor(private natsDemoService: NatsDemoService, private loginHttpService: LoginHttpService) {
  }
  ngOnInit() {
    let jwt = localStorage.getItem('jwt');
    if (jwt != null) {
      const claims = decodeJwt(jwt);
      if (claims.exp != undefined && claims.exp > Date.now() / 1000) {
        jwt = null;
      }
    }
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
      if (this.pubTopicFc.value !== null && this.pubDataFc.value !== null) {
        console.log(`pub ${this.pubTopicFc.value} ${this.pubDataFc.value}`);
        Promise.resolve(this.natsDemoService.pub(this.pubTopicFc.value, this.pubDataFc.value));
      }
    }
  }

  natsSvcSetup() {
    if (this.seed != null && this.jwt != null) {
      const seed_raw = new Uint8Array(Buffer.from(this.seed, 'base64'));
      this.natsDemoService.setUp(this.jwt!, seed_raw);
    }
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
            console.log(msg.jwt);
            this.validateJwt();
            this.natsSvcSetup();
          }
          else {
            this.passwordFc.setErrors({ 'invalid': true });
          }
        });
      }
    }
  }
}
