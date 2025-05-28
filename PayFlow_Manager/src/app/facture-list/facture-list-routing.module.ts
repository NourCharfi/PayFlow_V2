import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FactureListComponent } from './facture-list.component';
import { AddFactureComponent } from '../add-facture/add-facture.component';
import { ModifierFactureComponent } from '../modifer-facture/modifer-facture.component';
import { ReglementListComponent } from '../reglement-list/reglement-list.component';

const routes: Routes = [
    { 
        path: 'factures',
        children: [
            { path: '', component: FactureListComponent },
            { path: 'add', component: AddFactureComponent },
            { path: 'edit/:id', component: ModifierFactureComponent },
            { path: 'payments/:id', component: ReglementListComponent }
        ]
    }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class FactureListRoutingModule { }
