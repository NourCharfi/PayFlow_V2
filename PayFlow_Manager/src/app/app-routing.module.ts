import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReglementListComponent } from './reglement-list/reglement-list.component';
import { AddReglementComponent } from './add-reglement/add-reglement.component';
import { ModiferReglementsComponent } from './modifer-reglements/modifer-reglements.component';
import { AddFactureComponent } from './add-facture/add-facture.component';
import { ModifierFactureComponent } from './modifer-facture/modifer-facture.component';
import { FactureListRoutingModule } from './facture-list/facture-list-routing.module';
import { ClientListComponent } from './client-list/client-list.component';
import { AddClientComponent } from './add-client/add-client.component';
import { ProductListComponent } from './product-list/product-list.component';
import { AddProductComponent } from './add-product/add-product.component';
import { PrintFactureComponent } from './print-facture/print-facture.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  
  // Protected routes with auth guard
  { 
    path: 'home', 
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'factures', 
    loadChildren: () => import('./facture-list/facture-list.module').then(m => m.FactureListModule),
    canActivate: [AuthGuard]
  },
  { path: 'add-facture', component: AddFactureComponent, canActivate: [AuthGuard] },
  { path: 'factures/edit/:id', component: ModifierFactureComponent, canActivate: [AuthGuard] },
  { path: 'factures/print/:id', component: PrintFactureComponent, canActivate: [AuthGuard] },
  
  // Reglement routes
  { 
    path: 'reglement-list', 
    children: [
      { path: ':id', component: ReglementListComponent },
      { path: '', component: ReglementListComponent }
    ],
    canActivate: [AuthGuard]
  },
  { path: 'add-reglement', component: AddReglementComponent, canActivate: [AuthGuard] },
  { path: 'add-reglement/:id', component: AddReglementComponent, canActivate: [AuthGuard] },
  { path: 'modifier-reglement/:id', component: ModiferReglementsComponent, canActivate: [AuthGuard] },
  { path: 'factures/:id/reglements', redirectTo: 'reglement-list/:id', pathMatch: 'full' },
  
  // Client routes
  { path: 'clients', component: ClientListComponent, canActivate: [AuthGuard] },
  { path: 'clients/add', component: AddClientComponent, canActivate: [AuthGuard] },
  { path: 'clients/edit/:id', component: AddClientComponent, canActivate: [AuthGuard] },
  
  // Product routes sécurisées
  { path: 'products', component: ProductListComponent, canActivate: [AuthGuard] },
  { path: 'products/add', component: AddProductComponent, canActivate: [AuthGuard] },
  { path: 'products/edit/:id', component: AddProductComponent, canActivate: [AuthGuard] },
  // User management
  //{ path: 'users', component: UsersComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    
    FactureListRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
