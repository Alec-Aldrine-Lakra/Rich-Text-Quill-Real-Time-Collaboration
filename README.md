# Rich-Text-Quill-Real-Time-Collaboration


Real Time Rich Text Collaboration for quill in Angular 8 using the ngx-quill module. I have implemented quill-cursors and @teamwork/sharedb
to show real time data between anyone connected. For reliability I am storing the data in mongodb database using @teamwork/sharedb-mongo 
adapter.

# Note
In the frontend I am implementing json web tokens to decode the token and send cursor position, id and name. I assume that the token is already 
present and  there is no token verification that's been added right now. At every selectionChange() event the socket broadcasts its cursor data
to all other clients
