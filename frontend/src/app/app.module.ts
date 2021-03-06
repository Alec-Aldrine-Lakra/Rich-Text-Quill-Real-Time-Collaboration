import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import {QuillModule} from "ngx-quill";
import { AppComponent } from "./app.component";
import { EditorComponent } from './editor/editor.component';
import { AppRoutingModule } from './app-routing.module';
@NgModule({
  declarations: [AppComponent, EditorComponent],
  imports: [BrowserModule, AppRoutingModule, QuillModule.forRoot()],//, MentionModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule  { }
