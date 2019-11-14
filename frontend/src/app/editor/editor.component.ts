import { QuillEditorComponent } from 'ngx-quill';
import {ViewChild, Component, OnInit } from '@angular/core';
import Quill from 'quill';
import {SocketsService} from '../sockets.service';
import BlotFormatter from 'quill-blot-formatter';

import 'quill-autoformat';
import MagicUrl from 'quill-magic-url';
import QuillCursors from 'quill-cursors';
import ImageResize  from 'quill-image-resize';
import QuillBetterTable from "quill-better-table";
Quill.register('modules/blotFormatter', BlotFormatter);
Quill.register('modules/magicUrl', MagicUrl);
Quill.register({'modules/better-table' : QuillBetterTable},true);
Quill.register({'modules/cursors':QuillCursors},true); 

import jsondecoder from 'jsonwebtoken/decode.js';
var chance = require('chance').Chance();
let s = new SocketsService();

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})

export class EditorComponent implements OnInit {
  @ViewChild(QuillEditorComponent, { static: true })
  editor: QuillEditorComponent;
  content = '';
  items: string[] = ["Irshad", "Anmol"];
  public modules: any;
  public cursor: any;
  public cursorModule: any;
  constructor() {
    this.modules = {
      blotFormatter:{},
      magicUrl: true,
      autoformat:  {
        mention: {
          trigger: /[\s.,;:!?]/,
          find: /(?:^|\s)@[^\s.,;:!?]+/i,
          extract: /@([^\s.,;:!?]+)/i,
          transform: '$1',
          insert: 'mention'
        }
      },
      cursors: {
          hideDelayMs: 5000,
          hideSpeedMs: 1000,
          transformOnTextChange: true
      },
      //imageResize: {},
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
    let token = JSON.parse(localStorage.getItem('currentUser')).token;
    let {name,id} = jsondecoder(token).user; //name
    this.cursor = new Cursor(id,name,null);
    this.cursor.updateCursor(null);
    this.cursorModule =  this.editor.quillEditor.getModule('cursors'); 
    s.socket2.addEventListener('message',data=>{
      let d = JSON.parse(data.data);
      if(sessionStorage.getItem(d.id)){
        this.cursorModule.moveCursor(d.id,d.range); //if cursor already exists just update range
      } 
      else
        this.cursorModule.createCursor(d.id, d.name, d.color, d.range); //if cursor doesn't exist in other person's browser
      sessionStorage.setItem(d.id, JSON.stringify(d)); //update cursors contents
    })

    s.doc.subscribe((err)=>{ // Get initial value of document and subscribe to changes
      if(err) throw err;
       $event.setContents(s.doc.data);
        s.doc.on('op', (op, source)=>{
        if (source === 'quill') return;
        $event.updateContents(op);
      });
    });


  }
  
  logChanged($event)
  { 
    if ($event.source !== 'user') return;
    s.doc.submitOp($event.delta, {source: 'quill'});
  }
  selectionUpdate($event)
  {
    this.cursor.updateCursor(this.editor.quillEditor.getSelection());
  }
  ngOnInit() {
  }

}

class Cursor{
  public id: string;
  public range: any;
  public color: string;
  public name: string;
  constructor(id: string, name: string,range: null){
    this.name = name;
    this.id = id;
    this.color = chance.color({format:'hex'});
    this.range=null;
  }

  updateCursor(range){
    this.range = range;
    let name = this.name;
    let id = this.id;
    let color = this.color;
    let data = JSON.stringify({name, id, color, range});
    s.socket2.send(data);
  }
}
