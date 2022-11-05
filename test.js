var express = require('express');
var app = express();
const mongoose = require('mongoose');

app.listen(3000);

mongoose.connect('mongodb://vncAdmin:vinhCuong2021@ec2-3-21-163-206.us-east-2.compute.amazonaws.com:27017/FinalProject', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}, function (err) {
    if (err) {
        console.log('Mongo connect error: ' + err);
    } else {
        console.log('Mongo connect successfully !');
    }
});