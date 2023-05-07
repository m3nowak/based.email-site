import { Component } from '@angular/core';
import { NatsDemoService } from './nats-demo.service';
import { DmzHttpService } from './dmz-http.service';

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

  constructor(private natsDemoService: NatsDemoService, private dmzHttpService: DmzHttpService) {
  }
  ngOnInit() {
    let creds = localStorage.getItem('creds');
    let username = localStorage.getItem('username');
    if (creds !== null && username !== null) {
      this.creds = creds;
      this.username = username;
    }
    else {
      this.dmzHttpService.getCreds().subscribe((dmzResp) => {
        this.creds = dmzResp.creds;
        this.username = dmzResp.username;
        localStorage.setItem('creds', this.creds);
        localStorage.setItem('username', this.username);
      });

    }

    
    // this.natsDemoService.subscribe("test").then((observable) => {
    //   observable.subscribe((msg) => {
    //     this.msgs.push(msg);
    //   });
    // });
  }
  sendSomething() {
    this.natsDemoService.login(this.username, this.creds).then((msg) => {
      this.msgs.push(msg);
    });
  }
}
