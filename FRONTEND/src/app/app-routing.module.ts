import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../service/auth.guard';
import { IndexComponent } from './index/index.component';
import { LoginComponent } from './login/login.component';
import { DashboardEmpleadoComponent } from './dashboard-empleado/dashboard-empleado.component';
import { DashboardDuenoComponent } from './dashboard-dueno/dashboard-dueno.component';
import { DuenoGuard } from './guards/dueno.guard';
import { EmpleadoGuard } from './guards/empleado.guard';

const routes: Routes = [
  {path: 'index', component: IndexComponent },
  {path: 'login', component: LoginComponent},
  
  // Dashboard para empleado
  {
    path: 'dashboard', 
    component: DashboardEmpleadoComponent, 
    canActivate: [AuthGuard, EmpleadoGuard]
  },
  
  // Dashboard para dueño
  {
    path: 'dashboard-admin', 
    component: DashboardDuenoComponent, 
    canActivate: [AuthGuard, DuenoGuard]
  },
  
  { path: '', redirectTo: '/index', pathMatch: 'full' },
  { path: '**', redirectTo: '/index' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
