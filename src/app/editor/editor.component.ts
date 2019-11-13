import { QuillEditorComponent } from 'ngx-quill';
import {ViewChild, Component, OnInit } from '@angular/core';
import Quill from 'quill';
//import 'quill-mention';
import QuillCursors from 'quill-cursors';
import ImageResize  from 'quill-image-resize';
import QuillBetterTable from "quill-better-table";
Quill.register({'modules/better-table' : QuillBetterTable},true);
Quill.register({'modules/cursors':QuillCursors},true); 
Quill.register({'modules/imageResize' : ImageResize},true);


@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})

export class EditorComponent implements OnInit {
  @ViewChild(QuillEditorComponent, { static: true })
  editor: QuillEditorComponent;
  content = '';
  public modules: any;
  constructor() {
    this.modules = {
      // mention: {
      //   allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
      //   mentionDenotationChars: ["@"],
      //   onSelect: (item, insertItem) => {
      //     const editor = this.editor.quillEditor as Quill
      //     insertItem(item);
      //     editor.insertText(editor.getLength() - 1, '', 'user')
      //   },
      //   source: (searchTerm, renderList) => {
      //     const values = [
      //       { id: 1, value: 'Alec'},
      //       { id: 2, value: 'Irshad'},
      //       { id: 3, value: 'Anmol'},
      //       { id: 4, value: 'MunMun'},
      //       { id: 5, value:'Zoya'}
      //     ]
      //     if (searchTerm.length === 0) {
      //       renderList(values, searchTerm)
      //     } else {
      //       const matches = []
      //       values.forEach((entry) => {
      //         if (entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
      //           matches.push(entry)
      //         }
      //       })
      //       renderList(matches, searchTerm)
      //     }
      //   }
      // },
      cursors: {
          hideDelayMs: 5000,
          hideSpeedMs: 1000,
          transformOnTextChange: true
      },
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
  }
  editorCreated($event){
    console.log(this.editor.quillEditor);
  }

  ngOnInit() {
  }

}
