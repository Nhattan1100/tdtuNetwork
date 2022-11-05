const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        ref: 'User'
    },
    content: {
        First: String,
        Last: String,
        Image: String,
        VideoId: String
    },
    Date: Number
});

module.exports = mongoose.model('Post', postSchema);