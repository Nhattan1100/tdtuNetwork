const mongoose = require('mongoose');
const likeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.ObjectId,
        ref: 'User'
    },
    postId:{
        type: mongoose.ObjectId,
        ref: 'Post'
    },
    Date: Number
});

module.exports = mongoose.model('Like',likeSchema);