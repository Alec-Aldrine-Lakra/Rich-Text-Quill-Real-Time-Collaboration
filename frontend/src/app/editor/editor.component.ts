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
var icons = Quill.import('ui/icons');
icons['Comment'] = '<svg xmlns="http://www.w3.org/2000/svg" viewbox="-21 -47 682.66669 682" ><path d="m552.011719-1.332031h-464.023438c-48.515625 0-87.988281 39.472656-87.988281 87.988281v283.972656c0 48.421875 39.300781 87.824219 87.675781 87.988282v128.871093l185.183594-128.859375h279.152344c48.515625 0 87.988281-39.472656 87.988281-88v-283.972656c0-48.515625-39.472656-87.988281-87.988281-87.988281zm-83.308594 330.011719h-297.40625v-37.5h297.40625zm0-80h-297.40625v-37.5h297.40625zm0-80h-297.40625v-37.5h297.40625zm0 0"/></svg>';


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
    this.doc = s.connection.get('examples','richtext7'); //getting document with id 'richtext7' from 'examples' collection
    localStorage.setItem('roomid','richtext7'); //setting roomid same as documentid
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
      if(d.text && d.comment)
          this.formatComment(d.name,d.comment, d.range);
      else if(d.id ! = id && d.name!= name)
      {  
        if(sessionStorage.getItem(d.id)){
          this.cursorModule.moveCursor(d.id,d.range); //if cursor already exists just update range
        } 
        else
          this.cursorModule.createCursor(d.id, d.name, d.color, d.range); //if cursor doesn't exist in other person's browser
        sessionStorage.setItem(d.id, JSON.stringify(d)); //update cursors contents
      }
    })


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
              this.editor.quillEditor.formatText(range.index, range.length, {
                background: "#fff72b"
              });
              this.editor.quillEditor.formatText(0,0, {
                background: "#ffffff"
              });
              let comment = new Comment(id, name, prompt, range, text);
              comment.sendComment();
          }
      }
    });

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
  formatComment(name,comment,range){
    let d = new Date();
    let s  = d.toString();
    s = s.substring(0,s.indexOf('G'));

    this.editor.quillEditor.formatText(range.index, range.length,{
      background: "#fff72b"
    });
    let d0 = document.getElementsByClassName('comments')[0];
    let d1 = document.createElement('div');
    d1.setAttribute('class','padd');
    let s1 = document.createElement('span');
    s1.setAttribute('id','resolve');
    s1.appendChild(document.createTextNode(`Resolve`));
    let br1 = document.createElement('br');
    let br2 = document.createElement('br');
    let ul = document.createElement('ul');
    let l1 = document.createElement('li');
    l1.appendChild(document.createTextNode(`Name : ${name}`));
    let l2 = document.createElement('li');
    l2.appendChild(document.createTextNode(`Time : ${s}`));
    let l3 = document.createElement('li');
    l3.appendChild(document.createTextNode(`Comment : ${comment}`));
    ul.appendChild(l1);
    ul.appendChild(l2);
    ul.appendChild(l3);
    d1.appendChild(s1);
    d1.appendChild(br1);
    d1.appendChild(br2);
    d1.appendChild(ul);
    d0.appendChild(d1);
  }
  ngOnInit() {
  }

}

class Cursor{
  public id: string;
  public color: string;
  public name: string;
  public roomid: string;
  constructor(id: string, name: string){
    this.name = name;
    this.id = id;
    this.color = chance.color({format:'hex'});
    this.roomid = localStorage.getItem('roomid');
  }

  updateCursor(r){
    let [name, id, color, range, roomid] = [this.name, this.id, this.color, r, this.roomid];
    let data = JSON.stringify({name, id, color, range, roomid});
    s.socket2.send(data);
  }
}

class Comment extends Cursor{
  public comment: any;
  public range: any;
  public text: any;
  constructor(id: string, name: string,comment: string, range: any, text: string){
    super(id,name);
    this.comment = comment;
    this.range = range;
    this.text = text;
  }
  sendComment(){
    let [name, id, color, range, roomid, comment, text] = [this.name, this.id, this.color, this.range, this.roomid, this.comment, this.text];
    let data = JSON.stringify({name, id, color, range, roomid, comment, text});
    s.socket2.send(data);
  }
}

