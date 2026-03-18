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
import { HomeComponent } from './home/home.component';
import { RegistroComponent } from './registro/registro.component';
import { ReservarCitaComponent } from './reservarcita/reservarcita.component';
import { MiperfilComponent } from './miperfil/miperfil.component';
import { LoginadminComponent } from './loginadmin/loginadmin.component';
import { CitasprogramadasComponent } from './citasprogramadas/citasprogramadas.component';


@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    LoginComponent,
    HomeComponent,
    RegistroComponent,
    ReservarCitaComponent,
    MiperfilComponent,
    LoginadminComponent,
    CitasprogramadasComponent,
  
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
            primaryColor: '#00bcd4',
          }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
