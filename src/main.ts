import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports:[RouterOutlet],
  template: `
 <router-outlet></router-outlet>
 
  `,
})
export class App {
  name = 'Angular';
}



bootstrapApplication(App ,{
  providers: [provideRouter(routes)]
});

