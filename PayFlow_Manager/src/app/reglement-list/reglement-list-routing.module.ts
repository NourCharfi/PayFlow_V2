import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReglementListComponent } from './reglement-list.component';
import { AddReglementComponent } from '../add-reglement/add-reglement.component';
import { ModiferReglementsComponent } from '../modifer-reglements/modifer-reglements.component';


const routes: Routes = [
  { path: '', component: ReglementListComponent },
  { path: ':id', component: ReglementListComponent },
  { path: ':id/ajouter', component: AddReglementComponent },
  { path: ':factureId/modifier/:reglementId', component: ModiferReglementsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ReglementListRoutingModule { }