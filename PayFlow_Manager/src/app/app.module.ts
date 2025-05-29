import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgChartsModule } from 'ng2-charts';
import { DashboardComponent } from './dashboard/dashboard.component';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReglementListComponent } from './reglement-list/reglement-list.component';
import { AddReglementComponent } from './add-reglement/add-reglement.component';
import { ModiferReglementsComponent } from './modifer-reglements/modifer-reglements.component';
import { AddFactureComponent } from './add-facture/add-facture.component';
import { ModifierFactureComponent } from './modifer-facture/modifer-facture.component';
import { FooterComponent } from './footer/footer.component';
import { ClientListComponent } from './client-list/client-list.component';
import { AddClientComponent } from './add-client/add-client.component';
import { ProductListComponent } from './product-list/product-list.component';
import { AddProductComponent } from './add-product/add-product.component';
import { PrintFactureComponent } from './print-facture/print-facture.component';
import { NlToBrPipe } from './pipes/nl-to-br.pipe';
import { NavbarComponent } from './navbar/navbar.component';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';

@NgModule({
  declarations: [
    AppComponent,
    ReglementListComponent,
    AddReglementComponent,
    ModiferReglementsComponent,
    AddFactureComponent,
    ModifierFactureComponent,
    ClientListComponent,
    AddClientComponent,
    ProductListComponent,
    AddProductComponent,
    FooterComponent,
    NavbarComponent,
    PrintFactureComponent,
    NlToBrPipe,
    DashboardComponent,
    LoginComponent,
    UsersComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgChartsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true
    })
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }