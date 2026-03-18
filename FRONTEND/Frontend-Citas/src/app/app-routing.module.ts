import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../service/auth.guard';
import { IndexComponent } from './index/index.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { RegistroComponent } from './registro/registro.component';
import { ReservarCitaComponent } from './reservarcita/reservarcita.component';
import { MiperfilComponent } from './miperfil/miperfil.component';
import { LoginadminComponent } from './loginadmin/loginadmin.component';
import { AdminGuard } from './guards/admin.guard';


const routes: Routes = [
  {path: 'index', component: IndexComponent },
  {path: 'login', component: LoginComponent},
  {path: 'registro', component: RegistroComponent},
  {path: 'home', component: HomeComponent, canActivate: [AuthGuard]},
  {path: 'reservarcita', component: ReservarCitaComponent, canActivate: [AuthGuard]},
  {path: 'miperfil', component: MiperfilComponent, canActivate: [AuthGuard]},
  {path: 'panel-admin-9472', component: LoginadminComponent, canActivate: [AdminGuard]},
  { path: '', redirectTo: '/index', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
