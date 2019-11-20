import { QuillEditorComponent } from 'ngx-quill';
import {ViewChild, Component, OnInit } from '@angular/core';
import Quill from 'quill';
import {SocketsService} from '../sockets.service';
import BlotFormatter from 'quill-blot-formatter';
import 'quill-autoformat';
import MagicUrl from 'quill-magic-url';
import QuillCursors from 'quill-cursors';
import QuillBetterTable from "quill-better-table";
import moment from 'moment-timezone'
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
  @ViewChild(QuillEditorComponent)
  editor: QuillEditorComponent;
  content = '';
  public modules: any;
  public cursor: any;
  public cursorModule: any;
  public doc: any;
  private name: string;
  private id: string;

  constructor() {
    localStorage.setItem('roomid','richtext7'); //setting roomid same as documentid

    this.name = jsondecoder(JSON.parse(localStorage.getItem('currentUser')).token).user.name;
    this.id = jsondecoder(JSON.parse(localStorage.getItem('currentUser')).token).user.id;
    this.doc = s.connection.get('examples','richtext7'); //getting document with id 'richtext7' from 'examples' collection

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

    this.cursor = new Cursor(this.id,this.name);
    this.cursor.updateCursor(null);
    this.cursorModule =  this.editor.quillEditor.getModule('cursors'); 
    
    s.socket2.addEventListener('message',data=>{
      let d = JSON.parse(data.data);
      if(d.text && d.comment)
          this.addComment(d.comment_id, d.datetime, d.id, d.name,d.comment, d.range); //Adding comment
      else if(d.message === "delete")
          this.removeComment(d.id);
      else if(d.id ! = this.id && d.name!= this.name)
      {  
        if(sessionStorage.getItem(d.id)){
          this.cursorModule.moveCursor(d.id,d.range); //if cursor already exists just update range
        } 
        else
          this.cursorModule.createCursor(d.id, d.name, d.color, d.range); //if cursor doesn't exist in other person's browser
        sessionStorage.setItem(d.id, JSON.stringify(d)); //update cursors contents
      }
    })


    var customButton = document.querySelector('.ql-Comment'); //comment event handler
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
              var text = this.editor.quillEditor.getText(range.index, range.length);
              this.editor.quillEditor.formatText(range.index, range.length, {
                background: "#fff72b"
              });
              this.editor.quillEditor.formatText(0,0, {
                background: "#ffffff"
              });
              let comment = new Comment(this.id, this.name, prompt, range, text);
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
    } );
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

  addComment(commentid, created_on, id, name,comment,range){

    this.editor.quillEditor.formatText(range.index, range.length,{ //coloring selection
      background: "#fff72b"
    });
    let d = moment.tz(created_on, "Asia/Kolkata").format().toString();
    let d0 = document.getElementsByClassName('comments')[0];
    let d1 = document.createElement('div');
    d1.setAttribute('class','padd');
    d1.setAttribute('id',commentid);
    if(this.name === name && this.id===id){ //Only person who types the comment has resolve option
      var s1 = document.createElement('span');
      s1.setAttribute('class','resolve');
      s1.appendChild(document.createTextNode(`Resolve`));
      d1.appendChild(s1);
    }   

    let ul = document.createElement('ul');
    let l1 = document.createElement('li');
    l1.appendChild(document.createTextNode(`${name}`));
    let l2 = document.createElement('li');
    l2.appendChild(document.createTextNode(`${d.substring(0,d.indexOf('T'))}`)); //show date
    let l3 = document.createElement('li');
    l3.appendChild(document.createTextNode(`${d.substring(d.indexOf('T')+1, d.indexOf('+'))}`)); //show time
    let l4 = document.createElement('li');
    l4.appendChild(document.createTextNode(`${comment}`));
    ul.appendChild(l1);
    ul.appendChild(l2);
    ul.appendChild(l3);
    ul.appendChild(document.createElement('br'));
    ul.appendChild(l4); 
    d1.appendChild(ul);
    d0.appendChild(d1);

    if(this.name === name && this.id===id){ //Only person who types the comment has resolve option
      s1.addEventListener('click',()=>{
        s1.parentNode.parentNode.removeChild(d1);
        console.log();
      })
    }  
  }

  removeComment(id){
    let d0 = document.getElementsByClassName('comments')[0];
    d0.removeChild(document.getElementById(id));
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
  deleteComment(commentid){
    let message = "delete";
    s.socket2.send(JSON.stringify({commentid, message}))
  }
}

