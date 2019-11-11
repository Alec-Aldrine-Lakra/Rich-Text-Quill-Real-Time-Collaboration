import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { QuillConfig, QuillModule } from "ngx-quill";
import * as Quill from "quill";
import QuillBetterTable from "quill-better-table";
import { AppComponent } from "./app.component";
import ImageResize  from 'quill-image-resize';
Quill.register({'modules/imageResize' : ImageResize},true);
Quill.register({'modules/better-table' : QuillBetterTable},true);

const quillConfig: QuillConfig = {
  modules: {
    imageResize: {},
    table: false, // disable table module
    "better-table": {
      operationMenu: {
        items: {
          unmergeCells: {
            text: "Another unmerge cells name"
          }
        },
        color: {
          colors: ["#fff", "red", "rgb(0, 0, 0)"], // colors in operationMenu
          text: "Background Colors" // subtitle
        }
      }
    },
    keyboard: {
      bindings: QuillBetterTable.keyboardBindings
    }
  }
};
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, QuillModule.forRoot(quillConfig)],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule  { }
