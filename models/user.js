const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    Image: String,
    Name: String,
    local: {
        Username: String,
        Password: String,
        From: [String]
    },
    google:{
        id: String,
        Email: String,
        Token: String,
        Class: String,
        Facility: String
    },
    userGroup: Number // 0 là admin 1 là normal 2 la student
});

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, 8);
};

userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.Password);
};

module.exports = mongoose.model('User',userSchema);