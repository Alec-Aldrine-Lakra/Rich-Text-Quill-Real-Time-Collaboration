const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fname:{
        type: String,
        required: true
    },
    lname:{
      type: String,
      required: true
    },
    email:{
      type: String,
      required: true
    },
    password:{
      type: String,
      required: true
    },
    created_on:{
      type: Date, 
      default: new Date()
    }
  });
  
  module.exports = mongoose.model('User', userSchema);