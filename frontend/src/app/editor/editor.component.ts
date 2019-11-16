import { QuillEditorComponent } from 'ngx-quill';
import {ViewChild, Component, OnInit } from '@angular/core';
import Quill from 'quill';
import {SocketsService} from '../sockets.service';
import BlotFormatter from 'quill-blot-formatter';
import 'quill-autoformat';
import MagicUrl from 'quill-magic-url';
import QuillCursors from 'quill-cursors';
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
  public modules: any;
  public cursor: any;
  public cursorModule: any;
  public doc: any;

  constructor() {
    this.doc = s.connection.get('examples','richtext7');
    localStorage.setItem('roomid','richtext7');
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
          hideDelayMs: 8000,
          hideSpeedMs: 5000,
          transformOnTextChange: true
      },
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
      },
      toolbar:[['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      ['blockquote', 'code-block'],
    
      [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'direction': 'rtl' }],                         // text direction
    
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['Comment']  ]
    };
  }

  editorCreated($event){
      var customButton = document.querySelector('.ql-Comment');
      customButton.addEventListener('click',()=>{
        var range = this.editor.quillEditor.getSelection();
        if(!range || range.length==0)
            alert('Please select a Text');
        else
        {
            var prompt = window.prompt("Please Enter Comment", "");
            if (prompt == null || prompt == "") {
              alert("User cancelled the prompt.");  
            } else {
                //range = this.editor.quillEditor.getSelection();
                var text = this.editor.quillEditor.getText(range.index, range.length);
                console.log("User has highlighted: ", text);
                console.log(range.index, range.length);
                this.editor.quillEditor.formatText(range.index, range.length, {
                  background: "#fff72b"
                });
                this.editor.quillEditor.formatText(0,0, {
                  background: "#ffffff"
                 });
                 localStorage.se
                //drawComments(metaData);
            }
        }

        
         console.log(this.editor.quillEditor.getSelection());
      });




    this.doc.fetch((err)=>{ //If the document does not exist
      if (err) throw err;
      if (this.doc.type === null) {
        this.doc.create([{insert: 'Document Created'}], 'rich-text');
        return;
      }
    });
   
    let token = JSON.parse(localStorage.getItem('currentUser')).token;
    let {name,id} = jsondecoder(token).user; //name
    this.cursor = new Cursor(id,name);
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

    this.doc.subscribe((err)=>{ // Get initial value of document and subscribe to changes
      if(err) throw err;
       $event.setContents(this.doc.data);
         this.doc.on('op', (op, source)=>{
            if (source === 'quill') return;
            $event.updateContents(op);
      });
    });
  }
  
  logChanged($event)
  { 
      if ($event.source !== 'user') return;  
      this.doc.submitOp($event.delta, {source: 'quill'});
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
  public roomid: string;
  constructor(id: string, name: string){
    this.name = name;
    this.id = id;
    this.color = chance.color({format:'hex'});
    this.range=null;
    this.roomid = localStorage.getItem('roomid');
  }

  updateCursor(r){
    this.range = r;
    let [name, id, color, range, roomid] = [this.name, this.id, this.color, this.range, this.roomid];
    let data = JSON.stringify({name, id, color, range, roomid});
    s.socket2.send(data);
  }
}
