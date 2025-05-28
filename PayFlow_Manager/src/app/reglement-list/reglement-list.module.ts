import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReglementListComponent } from './reglement-list.component';

@NgModule({
    declarations: [ReglementListComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild([
            { path: '', component: ReglementListComponent }
        ])
    ]
})
export class ReglementListModule { }