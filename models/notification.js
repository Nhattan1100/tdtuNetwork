const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    user:{
        type: mongoose.ObjectId,
        ref: 'User'
    },
    Tittle:String,
    content:String,
    For: String,
    Date: Number
});

module.exports = mongoose.model('Notification',notificationSchema);