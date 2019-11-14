const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    uid:{
      type: mongoose.ObjectId,
      required: true
    },
    name:{
        type: String,
        required: true
    },
    short_name:{
      type: String,
      required: true
    },
    roomid:{
      type: mongoose.ObjectId,
      default: null
    }
});
  
  module.exports = mongoose.model('Online', userSchema);