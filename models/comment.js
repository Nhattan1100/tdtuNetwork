const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    user:{
        type: mongoose.ObjectId,
        ref: 'User'
    },
    post:{
        type: mongoose.ObjectId,
        ref: 'Post'
    },
    content:String,
    Date: Number
});

module.exports = mongoose.model('Comment',commentSchema);