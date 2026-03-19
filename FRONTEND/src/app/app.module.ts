import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DropdownModule } from 'primeng/dropdown';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule }   from 'primeng/inputtext';
import { RecaptchaModule } from 'ng-recaptcha';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogModule } from 'primeng/dialog';

import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';

import Lara from '@primeng/themes/Lara';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { TokenInterceptor } from '../service/token.interceptor';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { IndexComponent } from './index/index.component';
import { DashboardEmpleadoComponent } from './dashboard-empleado/dashboard-empleado.component';
import { DashboardDuenoComponent } from './dashboard-dueno/dashboard-dueno.component';


@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    LoginComponent,
    DashboardEmpleadoComponent,
    DashboardDuenoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CardModule,
    ButtonModule,
    FormsModule,
    MessageModule,
    ToolbarModule,
    ReactiveFormsModule,
    InputTextModule,
    DropdownModule,
    RecaptchaModule,
    BrowserAnimationsModule,
    DialogModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    provideAnimations(),
    providePrimeNG({
      theme: {
          preset: Lara,
          options: {
            colorScheme: 'light',
            primaryColor: '#f59e0b',
          }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
