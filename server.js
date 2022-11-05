const express = require('express');
const config = require('./config/config');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const flash = require('connect-flash');
const cookieSession = require('cookie-session');
const multer = require("multer");

//express
const app = express();
app.use(express.static('public'));

//view engine
app.set('view engine', 'ejs');
app.set('views', './views');

//body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//mongoose
mongoose.connect(config.mongoUrlO, {
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

//passport
require('./config/passport')(config, passport);

app.use(cookieSession({
    name: 'user-session',
    maxAge: 24 * 60 * 60 * 1000,// a day
    keys: [config.privateKey]
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//multer

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/images/upload')
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname)
//     }
// });

// const upload = multer({
//     storage: storage,
//     fileFilter: function (req, file, cb) {
//         if (
//             file.mimetype == "image/bmp" ||
//             file.mimetype == "image/png" ||
//             file.mimetype == "image/jpg" ||
//             file.mimetype == "image/jpeg" ||
//             file.mimetype == "image/gif"
//         ) {
//             cb(null, true);
//         } else {
//             return cb(new Error("Only image are allowed!"));
//         }
//     }
// });

//firebase
const upload = multer({
    storage: multer.memoryStorage()
})


require('./routes/default')(app, config.privateKey, 'http://ec2-3-21-163-206.us-east-2.compute.amazonaws.com:3000', passport, upload);

//socketIO
const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on("connection", function (socket) {
    console.log('New connection: '+socket.id);
    socket.on("user_send_notification", function (Data) {
        var newData = {
            name: Data.Data.user.Name,
            time: Data.Data.noti.Date,
            tittle: Data.Data.noti.Tittle
        }
        socket.broadcast.emit("server_send_notification", newData);
    });


});

server.listen(config.port, function () {
    console.log('Server have been start at http://localhost:' + config.port);
});
