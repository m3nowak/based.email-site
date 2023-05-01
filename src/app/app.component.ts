import { Component } from '@angular/core';
import { NatsDemoService } from './nats-demo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'based-email-site';
  msgs: string[] = []; 
  constructor(private natsDemoService: NatsDemoService) {
  }
  ngOnInit() {
    this.natsDemoService.subscribe("test").then((observable) => {
      observable.subscribe((msg) => {
        this.msgs.push(msg);
      });
    });
  }
}
