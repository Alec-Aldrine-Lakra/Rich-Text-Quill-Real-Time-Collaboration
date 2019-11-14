import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import {QuillModule} from "ngx-quill";
import { AppComponent } from "./app.component";
import { EditorComponent } from './editor/editor.component';
import { AppRoutingModule } from './app-routing.module';
import {SocketsService} from './sockets.service';
//import { MentionModule } from 'angular-mentions';
@NgModule({
  declarations: [AppComponent, EditorComponent],
  imports: [BrowserModule, AppRoutingModule,QuillModule.forRoot()],//, MentionModule],
  providers: [SocketsService],
  bootstrap: [AppComponent]
})
export class AppModule  { }
