const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    docid:{
        type: String,
        required: true
    },
    uid:{
      type: String,
      required: true
    },
    comment:{
      type: String,
      required: true
    },
    range:{
      type: Object,
      required: true
    },
    resolved:{
      type: Boolean,
      default: false
    },
    comments:{
      type: Array,
      default: undefined
    },
    created_on:{
      type: Date, 
      default: new Date()
    }
  });
  
  module.exports = mongoose.model('Comments', commentSchema);