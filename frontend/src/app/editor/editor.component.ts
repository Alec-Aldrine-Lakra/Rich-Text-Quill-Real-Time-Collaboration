import jsondecoder from 'jsonwebtoken/decode.js';
import { QuillEditorComponent } from 'ngx-quill';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {ViewChild, Component, OnInit } from '@angular/core';
import Quill from 'quill';
//import {AuthService} from '../services/auth.service';
import BlotFormatter from 'quill-blot-formatter';
import 'quill-mention'
import MagicUrl from 'quill-magic-url';
import QuillCursors from 'quill-cursors';
// import QuillBetterTable from "quill-better-table";
import moment from 'moment-timezone'
Quill.register('modules/blotFormatter', BlotFormatter);
Quill.register('modules/magicUrl', MagicUrl);
// Quill.register({'modules/better-table' : QuillBetterTable},true);
Quill.register({'modules/cursors':QuillCursors},true); 

var icons = Quill.import('ui/icons');
icons['Comment'] = '<svg xmlns="http://www.w3.org/2000/svg" viewbox="-21 -47 682.66669 682" ><path d="m552.011719-1.332031h-464.023438c-48.515625 0-87.988281 39.472656-87.988281 87.988281v283.972656c0 48.421875 39.300781 87.824219 87.675781 87.988282v128.871093l185.183594-128.859375h279.152344c48.515625 0 87.988281-39.472656 87.988281-88v-283.972656c0-48.515625-39.472656-87.988281-87.988281-87.988281zm-83.308594 330.011719h-297.40625v-37.5h297.40625zm0-80h-297.40625v-37.5h297.40625zm0-80h-297.40625v-37.5h297.40625zm0 0"/></svg>';

var chance = require('chance').Chance();
let pageR = 0;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})

export class EditorComponent implements OnInit{

  @ViewChild(QuillEditorComponent)
  editor: QuillEditorComponent;
  content = '';

  public modules: any;
  public cursorModule: any;
  public doc: any;
  private connection: any;
  private sharedb: any;
  private socket1:any;
  private socket2:any;

  public id: string;
  public color: string;
  public name: string;
  public roomid: string;

  public comment: string;
  public range: any;
  public text: string; 

  constructor(){//public auth: AuthService) {
    window.onbeforeunload = ()=>{
      sessionStorage.clear();
    }
    this.sharedb = require('@teamwork/sharedb/lib/client');
    this.sharedb.types.register(require('rich-text').type);
    // Open WebSocket connection to ShareDB server
    this.socket1 = new ReconnectingWebSocket('ws://localhost:8080/sharedb'); 
    this.socket2 = new ReconnectingWebSocket('ws://localhost:8080/cursors');
    this.connection = new this.sharedb.Connection(this.socket1);
  }

  ngOnInit() {  
    this.name = jsondecoder(JSON.parse(localStorage.getItem('currentUser')).token).user.name;//this.auth.getInfo().name;
    this.id = jsondecoder(JSON.parse(localStorage.getItem('currentUser')).token).user.id; //this.auth.getInfo().id;
    this.color = chance.color({format:'hex'});
    this.roomid = 'richtext7';
    this.range = null;
    this.doc = this.connection.get('examples','richtext7'); //getting document with id 'richtext7' from 'examples' collection

    this.modules = {
      blotFormatter:{},
      magicUrl: true,
      mention: {
        allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
        onSelect: (item, insertItem) => {
          const editor = this.editor.quillEditor as Quill
          insertItem(item)
          // necessary because quill-mention triggers changes as 'api' instead of 'user'
          editor.insertText(editor.getLength() - 1, '', 'user')
        },
        source: (searchTerm, renderList) => {
          const values = [
            { id: 1, value: 'Anmol' },
            { id: 2, value: 'Md Irshad' }
          ]
  
          if (searchTerm.length === 0) {
            renderList(values, searchTerm)
          } else {
            const matches = []
  
            values.forEach((entry) => {
              if (entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
                matches.push(entry)
              }
            })
            renderList(matches, searchTerm)
          }
        }
      },
      cursors: {
          hideDelayMs: 8000,
          hideSpeedMs: 5000,
          transformOnTextChange: true
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
      [ 'link', 'image'],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['Comment']  ]
    };
  }

  editorCreated($event){ //fired when editor is created
    
    this.doc.fetch((err)=>{ //If the document does not exist
      if (err) throw err;
      if (this.doc.type === null) {
        this.doc.create([{insert: 'Document Created'}], 'rich-text');
        return;
      }
    });

    this.updateCursor();
    this.cursorModule =  this.editor.quillEditor.getModule('cursors'); 
    
    this.socket2.addEventListener('message',data=>{
      let d = JSON.parse(data.data);
      if(d.text && d.comment)
          this.addComment(d.comment_id, d.datetime, d.id, d.name,d.comment, d.range); //Adding comment
      else if(d.message === "delete")
          this.removeComment(d.commentid);
      else if(d.id!= this.id && d.name!= this.name)
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
      this.range = this.editor.quillEditor.getSelection();
      if(!this.range || this.range.length==0)
          alert('Please select a Text');
      else
      {
          var prompt = window.prompt("Please Enter Comment", "");
          if (prompt == null || prompt == "") {
            alert("User cancelled the prompt.");  
          } else {
              this.text = this.editor.quillEditor.getText(this.range.index, this.range.length);
              this.comment = prompt;
              this.sendComment();
          }
      }
    });

   this.doc.subscribe((err)=>{ // Get initial value of document and subscribe to changes
      if(err) throw err;
        $event.updateContents(this.doc.data);
        this.doc.on('op', (op, source)=>{ 
            if (source === 'quill') return;
            $event.updateContents(op);
        });
     });
   }
  
  logChanged($event) //fired when text changes
  { 
    if ($event.source !== 'user') return;
      ++pageR;
    if(window.performance.navigation.type ==1 &&  $event.delta.ops[0]['delete'] && pageR==1) return; //prevent from delete
    this.doc.submitOp($event.delta, {source: 'quill'});
  }

  selectionUpdate($event) //fired when selection changes  
  {
    this.range = this.editor.quillEditor.getSelection();
    this.updateCursor();
  }

  addComment(commentid, created_on, id, name,comment,range){ //fired when comment is added 

    this.editor.quillEditor.formatText(range.index, range.length,{ //coloring selection
      background: "#fff72b"
    });
    let d = moment.tz(created_on, "Asia/Kolkata").format().toString();
    let d0 = document.getElementsByClassName('comments')[0];
    let d1 = document.createElement('div');
    d1.setAttribute('class','padd');
    d1.setAttribute('id',commentid);
    d1.setAttribute('index',range.index);
    d1.setAttribute('length',range.length);
    if(this.name === name && this.id===id){ //Only person who types the comment has resolve option
      var s1 = document.createElement('span');
      s1.setAttribute('class','resolve');
      s1.appendChild(document.createTextNode(`Resolve`));
      d1.appendChild(s1);
    }   

    //Comment Creation 
    let ul = document.createElement('ul');
    let l1 = document.createElement('li');
    l1.appendChild(document.createTextNode(`${name}`)); //display name
    let l2 = document.createElement('li');
    l2.appendChild(document.createTextNode(`${d.substring(0,d.indexOf('T'))}`)); //display date
    let l3 = document.createElement('li');
    l3.appendChild(document.createTextNode(`${d.substring(d.indexOf('T')+1, d.indexOf('+'))}`)); //display time
    let l4 = document.createElement('li');
    l4.appendChild(document.createTextNode(`${comment}`)); //display comment
    ul.appendChild(l1);
    ul.appendChild(l2);
    ul.appendChild(l3);
    ul.appendChild(document.createElement('br'));
    ul.appendChild(l4); 
    d1.appendChild(ul);
    d0.appendChild(d1);

    if(this.name === name && this.id===id){ //Only person who types the comment has resolve option
      s1.addEventListener('click',()=>{
        this.deleteComment(d1.getAttribute('id')); //resolve button event listener
      })
    }  
  }

  removeComment(id){ //fired when socket event comment is removed
    let d0 = document.getElementsByClassName('comments')[0];
    let rChild = document.getElementById(id);
    let range = {index: rChild.getAttribute('index'), length: rChild.getAttribute('length')};
    this.editor.quillEditor.formatText(parseInt(range.index), parseInt(range.length), {background: "#ffffff"});
    d0.removeChild(rChild);
  }

  deleteComment(commentid){ //sending socket event to remove comments
    const message = "delete";
    this.socket2.send(JSON.stringify({commentid, message}));
  }

  updateCursor(){ //fired when cursor position is changed
    let [name, id, color, range, roomid] = [this.name, this.id, this.color, this.range, this.roomid];
    let data = JSON.stringify({name, id, color, range, roomid});
    console.log('hey');
    this.socket2.send(data);
  }

  sendComment(){ //socket event to send comment to other users
    let [name, id, color, range, roomid, comment, text] = [this.name, this.id, this.color, this.range, this.roomid, this.comment, this.text];
    let data = JSON.stringify({name, id, color, range, roomid, comment, text});
    this.socket2.send(data);
  }
}

