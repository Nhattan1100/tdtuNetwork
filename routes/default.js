const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Like = require('../models/like')
const Notification = require('../models/notification');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require("sharp");

const {bucket} = require("../config/firebase");

module.exports = function (app, privateKey, domain, passport, upload) {
    app.get('/', isLoggedIn, function (req, res) {
        res.render('default', {domain: domain, user: req.user, page: 'home', title: 'Trang chủ'});
    });

    app.get('/user/:userId', function (req, res) {
        let userId = req.params.userId;
        User.findById(userId, function (err, data) {
            if (err) {
                console.log(err)
                res.redirect('/');
            } else {
                res.render('default', {
                    domain: domain,
                    user: req.user,
                    owner: data,
                    page: 'user',
                    title: 'Trang cá nhân'
                });
            }
        })
    })

    //Authentication
    app.get('/login', function (req, res) {
        res.render('login', {domain: domain, title: 'Đăng nhập hệ thống', message: req.flash('loginMessage')})
    });

    app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: '/login',
        successRedirect: '/',
        failureFlash: true
    }));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    //Admin add user
    app.get('/adduser', function (req, res) {
        if (req.user.userGroup == 0) {
            res.render('default', {domain: domain, user: req.user, page: 'adduser', title: 'Tạo tài khoản'})
        } else {
            res.redirect('/');
        }
    });

    app.post('/adduser', function (req, res) {
        //Params: Name, Username,Password,Categories
        let Name = req.body.txtAName;
        let Username = req.body.txtAUsername;
        let Image = req.body.inputAvatar;
        let Password = req.body.txtAPassword;
        let Categories = req.body.selectCategories;

        User.findOne({'local.Username': Username}, function (err, user) {
            if (err) {
                console.log('Error: ' + err);
                res.json({result: 0, message: 'Vui lòng thử lại sau !'});
            }
            if (user) {
                res.json({result: 2});
            } else {
                let newUser = new User({
                    Image: Image,
                    Name: Name,
                    local: {
                        Username: Username,
                        Password: new User().generateHash(Password),
                        From: Categories
                    },
                    userGroup: 1
                });
                newUser.save(function (err) {
                    if (err) {
                        console.log('Add user failed : ' + err);
                        res.json({result: 0, errorMsg: err});
                    } else {
                        res.json({result: 1});
                    }
                });
            }
        })
    });

    //Upload image

    // app.post('/uploadimage', function (req, res) {
    //     upload.single('file-0')(req, res, async function (err) {
    //         if (err instanceof multer.MulterError) {
    //             console.log("A Multer error occurred when uploading.");
    //             res.json({
    //                 result: -1,
    //                 errorMsg: "A Multer error occurred when uploading.",
    //             });
    //         } else if (err) {
    //             console.log("An unknown error occurred when uploading." + err);
    //             res.json({
    //                 result: -1,
    //                 errorMsg: "An unknown error occurred when uploading." + err,
    //             });
    //         }
    //         const {filename: image} = req.file;
    //
    //         await sharp(req.file.path)
    //             .resize(720, 576, {
    //                 fit: 'fill'
    //             })
    //             .jpeg({quality: 90})
    //             .toFile(
    //                 path.resolve(req.file.destination, 'resized', image)
    //             )
    //         fs.unlinkSync(req.file.path)
    //
    //         res.json({result: 1, file: req.file.filename});
    //     });
    // });

    app.post('/uploadimage', upload.single('file-0'), async function (req, res, next) {
        try {
            if (!req.file) {
                console.log("No file have been uploaded.");
                res.json({
                    result: 0,
                    errorMsg: "No file have been uploaded.",
                });
                return;
            }

            const blob = bucket.file(Date.now() + '-' + req.file.originalname);

            const blobWriter = blob.createWriteStream({
                metadata: {
                    contentType: req.file.mimetype,
                },
            });

            blobWriter.on('error', (err) => {
                console.log('On upload image: ' + err);
                next(err);
            });

            blobWriter.on('finish', () => {
                const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
                    bucket.name
                }/o/${encodeURI(blob.name)}?alt=media`;
                res.json({result: 1, file: publicUrl});
            });

            blobWriter.end(req.file.buffer);
        } catch (err) {
            console.log("An unknown error occurred when uploading :" + err);
            res.json({
                result: 0,
                errorMsg: "An unknown error occurred when uploading.",
            });
            return;
        }
    });

    //Change password
    app.get('/changepassword', function (req, res) {
        if (req.user.userGroup != 1) {
            res.redirect('/');
        }
        res.render('default', {domain: domain, user: req.user, page: 'changepassword', title: 'Thay đổi mật khẩu'});
    });

    app.post('/changepassword', function (req, res) {
        let txtCOPassword = req.body.txtCOPassword;
        let txtCNPassword = req.body.txtCNPassword;
        let user = req.user;
        console.log(user)

        if (!user.validPassword(txtCOPassword)) {
            res.json({result: 0, errorMsg: 'Mật khẩu cũ không chính xác !'});
        } else {
            let newpass = new User().generateHash(txtCNPassword);
            User.findByIdAndUpdate(user._id, {$set: {'local.Password': newpass}}, function (err) {
                if (err) {
                    console.log('UpdatePass' + err);
                    res.json({result: 0, errorMsg: 'Đã có lỗi xảy ra trong quá trình cập nhật !'});
                } else {
                    user.local.Password = newpass;
                    req.logIn(user, function (error) {
                        if (!error) {
                            res.json({result: 1});
                        } else {
                            console.log(error)
                            res.json({
                                result: -1,
                                errorMsg: 'Đã xảy ra lỗi không rõ nguyên nhân ! Vui lòng đăng nhập lại bằng mật khẩu mới !'
                            });
                        }
                    });
                }
            });
        }

    });

    //Change information
    app.get('/changeinformation', function (req, res) {
        if (req.user.userGroup != 2) {
            res.redirect('/');
        }
        res.render('default', {domain: domain, user: req.user, page: 'changeinformation', title: 'Thay đổi thông tin'});
    });

    app.post('/changeinformation', function (req, res) {
        let txtCName = req.body.txtCName;
        let txtCClass = req.body.txtCClass;
        let txtCFacility = req.body.txtCFacility;
        let inputAvatar = req.body.inputAvatar;
        let user = req.user;


        User.findByIdAndUpdate(user._id, {
            Name: txtCName,
            Image: inputAvatar,
            $set: {
                'google.Class': txtCClass,
                'google.Facility': txtCFacility
            }
        }, function (err) {
            if (err) {
                console.log('UpdateInformation' + err);
                res.json({result: 0, errorMsg: 'Đã có lỗi xảy ra trong quá trình cập nhật !'});
            } else {
                user.Name = txtCName;
                user.google.Class = txtCClass;
                user.google.Facility = txtCFacility;
                user.Image = inputAvatar;
                req.logIn(user, function (error) {
                    if (!error) {
                        res.json({result: 1});
                    } else {
                        console.log(error)
                        res.json({
                            result: -1,
                            errorMsg: 'Đã xảy ra lỗi không rõ nguyên nhân ! Vui lòng đăng nhập lại !'
                        });
                    }
                });
            }
        });
    });

    //Post
    app.post('/addpost', function (req, res) {
        let contentFull = req.body.contentFull;
        let contentFirst = contentFull.substring(0, 300);
        let contentLast = contentFull.substring(300,);
        let contentImage = req.body.contentImage;
        let contentVideoId = req.body.contentVideoId;

        let newPost = new Post({
            user: req.user._id,
            content: {
                First: contentFirst,
                Last: contentLast,
                Image: contentImage,
                VideoId: contentVideoId
            },
            Date: Date.now()
        });

        newPost.save(function (err) {
            if (err) {
                res.json({
                    result: 0,
                    errorMsg: 'Có lỗi không xác định trong quá trình đăng bài ! Vui lòng thử lại sau !'
                })
            } else {
                res.json({result: 1})
            }
        })
    });

    app.post('/editpost', function (req, res) {
        let contentFull = req.body.contentFull;
        let contentFirst = contentFull.substring(0, 300);
        let contentLast = contentFull.substring(300,);
        let contentImage = req.body.contentImage;
        let contentVideoId = req.body.contentVideoId;
        let postId = req.body.postId;

        Post.findByIdAndUpdate(postId, {
            content: {
                First: contentFirst,
                Last: contentLast,
                Image: contentImage,
                VideoId: contentVideoId
            }
        }, function (err) {
            if (err) {
                res.json({
                    result: 0,
                    errorMsg: 'Có lỗi không xác định trong quá trình sửa bài viết ! Vui lòng thử lại sau !'
                })
            } else {
                res.json({result: 1})
            }
        });

    });

    app.post('/loadpost', function (req, res) {
        let skip = parseInt(req.body.skip);
        let limit = parseInt(req.body.limit);

        if (req.user) {
            Post.find(null, null, {
                skip: skip,
                limit: 10,
                sort: {
                    Date: -1
                }
            }).populate('user').exec(function (err, data) {
                if (err) {
                    console.log(err)
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình tải bài viết !'});
                } else {
                    res.json({result: 1, data: data, user: req.user})
                }
            });
        } else {
            res.json({result: 0, errorMsg: 'Chưa đăng nhập !'});
        }

    });

    app.post('/loaduserpost', function (req, res) {
        let userId = req.body.userId;
        let skip = req.body.skip;

        if (req.user) {
            Post.find({user: userId}, null, {
                skip: skip,
                limit: 10,
                sort: {
                    Date: -1
                }
            }).populate('user').exec(function (err, data) {
                if (err) {
                    console.log(err)
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình tải bài viết !'});
                } else {
                    res.json({result: 1, data: data, user: req.user})
                }
            });
        } else {
            res.json({result: 0, errorMsg: 'Chưa đăng nhập !'});
        }

    });

    app.post('/deletepost', function (req, res) {
        let postId = req.body.postId;
        let userId = req.body.userId;
        if (userId == req.user._id || req.user.userGroup == 0) {
            Post.findByIdAndDelete(postId, function (err) {
                if (err) {
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình xoá bài !'});
                }
                res.json({result: 1});
            })
        } else {
            res.json({result: 0, errorMsg: 'Bạn không phải chủ bài viết !'});
        }
    });

    app.post('/getpost', function (req, res) {
        let postId = req.body.postId;
        let userId = req.body.userId;
        if (userId == req.user._id || req.user.userGroup == 0) {
            Post.findById(postId, null, null, function (err, data) {
                if (err) {
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình tải bài viết !'});
                }
                res.json({result: 1, data: data});
            })
        } else {
            res.json({result: 0, errorMsg: 'Bạn không phải chủ bài viết !'});
        }
    })

    //Comment

    app.post('/addcomment', function (req, res) {
        let userId = req.body.userId;
        let postId = req.body.postId;
        let content = req.body.content;

        let newComment = new Comment({
            user: userId,
            post: postId,
            content: content,
            Date: Date.now()
        });

        newComment.save(function (err) {
            if (err) {
                console.log(err);
                res.json({
                    result: 0,
                    errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình bình luận ! Vui lòng thử lại sau !'
                });
            } else {
                res.json({result: 1});
            }
        })

    });

    app.post('/editcomment', function (req, res) {
        let commentId = req.body.commentId;
        let content = req.body.content;
        console.log(commentId)
        console.log(content)

        Comment.findByIdAndUpdate(commentId, {
            content: content
        }, function (err) {
            if (err) {
                console.log(err)
                res.json({
                    result: 0,
                    errorMsg: 'Có lỗi không xác định trong quá trình sửa bình luận ! Vui lòng thử lại sau !'
                })
            } else {
                res.json({result: 1})
            }
        });

    });

    app.post('/loadcomment', function (req, res) {
        let postId = req.body.postId;

        Comment.find({post: postId}, null, {
            sort: {
                Date: -1
            }
        }).populate('user').exec(function (err, data) {
            if (err) {
                console.log(err)
                res.json({result: 0, errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình tải bình luận !'});
            } else {
                res.json({result: 1, data: data, user: req.user});
            }
        });
    });

    app.post('/deletecomment', function (req, res) {
        let commentId = req.body.commentId;
        let userId = req.body.userId;

        if (userId == req.user._id || req.user.userGroup == 0) {
            Comment.findByIdAndDelete(commentId, function (err) {
                if (err) {
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình xoá bình luận !'});
                }
                res.json({result: 1});
            })
        } else {
            res.json({result: 0, errorMsg: 'Bạn không phải chủ bình luận !'});
        }
    });

    app.post('/getcomment', function (req, res) {
        let commentId = req.body.commentId;
        let userId = req.body.userId;

        if (userId == req.user._id || req.user.userGroup == 0) {
            Comment.findById(commentId, null, null, function (err, data) {
                if (err) {
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình tải bình luận !'});
                }
                res.json({result: 1, data: data});
            })
        } else {
            res.json({result: 0, errorMsg: 'Bạn không phải chủ bình luận !'});
        }
    })

    //Like

    app.post('/loadlike', function (req, res) {
        let postId = req.body.postId;
        Like.find({postId: postId}, function (err, data) {
            if (err) {
                console.log(err)
                res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình tải bài viết !'});
            } else {
                res.json({result: 1, data: data})
            }
        })
    });

    app.post('/like', function (req, res) {
        let postId = req.body.postId;
        let userId = req.body.userId;

        let newLike = new Like({
            postId: postId,
            userId: userId,
            Date: Date.now()
        });

        newLike.save(function (err) {
            if (err) {
                console.log(err)
                res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình thích bài viết !'});
            } else {
                res.json({result: 1})
            }
        });

    });

    app.post('/dislike', function (req, res) {
        let postId = req.body.postId;
        let userId = req.body.userId;

        if (userId != req.user._id) {
            res.json({result: 0, errorMsg: 'Bạn không phải chủ lượt thích này !'});
        } else {
            Like.findOneAndDelete({postId: postId, userId: userId}, null, function (err) {
                if (err) {
                    console.log(err)
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình thích bài viết !'});
                } else {
                    res.json({result: 1})
                }
            })
        }


    });

    // Notification
    app.get('/addnotification', function (req, res) {
        if (req.user.userGroup !== 2) {
            res.render('default', {domain: domain, user: req.user, page: 'addnotification', title: 'Tạo thông báo'});
        } else {
            res.redirect('/');
        }
    });

    app.post('/addnotification', function (req, res) {
        let content = req.body.Noti.content;
        let Tittle = req.body.Noti.Tittle;
        let For = req.body.Noti.For;
        let user = req.user;

        let newNotificattion = new Notification({
            user: user._id,
            Tittle: Tittle,
            content: content,
            For: For,
            Date: Date.now()
        });
        if (req.user.userGroup !== 2) {
            newNotificattion.save(function (err) {
                if (!err) {
                    let lastData = {
                        user: user,
                        noti: newNotificattion
                    }
                    res.json({result: 1, data: lastData})
                } else {
                    res.json({result: 0, errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình đăng thông báo !'})
                }
            })
        } else {
            res.json({result: 0, errorMsg: 'Bạn không phải là Phòng/Khoa/Ban !'})
        }
    });

    app.get('/allnotification', function (req, res) {
        res.render('default', {domain: domain, user: req.user, page: 'allnotification', title: 'Tất cả thông báo'});
    });

    app.post('/loadnotification', function (req, res) {
        let sidebar = req.body.Sidebar;
        let For = req.body.For;
        let postId = req.body.postId;
        if (req.user) {
            if (sidebar !== 1 && !postId) {
                if (For === 'All') {
                    Notification.find(null, null, {
                        sort: {
                            Date: -1
                        }
                    }).populate('user').exec(function (err, data) {
                        if (err) {
                            console.log(err)
                            res.json({
                                result: 0,
                                errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình tải thông báo !'
                            });
                        } else {
                            res.json({result: 1, data: data, user: req.user});
                        }
                    });
                } else {
                    Notification.find({For: For}, null, {
                        sort: {
                            Date: -1
                        }
                    }).populate('user').exec(function (err, data) {
                        if (err) {
                            console.log(err)
                            res.json({
                                result: 0,
                                errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình tải thông báo !'
                            });
                        } else {
                            res.json({result: 1, data: data, user: req.user});
                        }
                    });
                }
            } else if (sidebar === 1 && !postId) {
                Notification.find(null, null, {
                    skip: 0,
                    limit: 5,
                    sort: {
                        Date: -1
                    }
                }).populate('user').exec(function (err, data) {
                    if (err) {
                        console.log(err)
                        res.json({result: 0, errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình tải thông báo !'});
                    } else {
                        res.json({result: 1, data: data, user: req.user});
                    }
                });
            } else if (postId && req.user.userGroup !== 2) {
                Notification.findById(postId).populate('user').exec(function (err, data) {
                    if (err) {
                        console.log(err)
                        res.json({
                            result: 0,
                            errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình tải thông báo !'
                        });
                    } else {
                        res.json({result: 1, data: data, user: req.user});
                    }
                });
            }
        } else {
            res.json({result: 0, errorMsg: 'Bạn chưa đăng nhập !'});
        }

    });

    app.get('/notification/:notiId', function (req, res) {
        var notiId = req.params.notiId;
        console.log(notiId)
        Notification.findById(notiId).populate('user').exec(function (err, data) {
            if (err || !data) {
                console.log('Get noti detail err: ', err)
                res.status(404).send('Không tồn tại !');
            } else {
                res.render('default', {
                    domain: domain,
                    user: req.user,
                    page: 'detailnotification',
                    title: 'Thông báo',
                    data: data,
                    date: timeSince(data.Date)
                });
            }
        })
    });

    app.post('/deletenotiication', function (req, res) {
        let notiId = req.body.notiId;
        let userId = req.body.userId;

        if (userId == req.user._id || req.user.userGroup == 0) {
            Notification.findByIdAndDelete(notiId, function (err) {
                if (err) {
                    res.json({result: 0, errorMsg: 'Đã có lỗi không xác định trong quá trình xoá thông báo !'});
                }
                res.json({result: 1});
            })
        } else {
            res.json({result: 0, errorMsg: 'Bạn không phải chủ thông báo !'});
        }
    });

    app.get('/editnotification/:notiId', function (req, res) {
        if (req.user.userGroup !== 2) {
            res.render('default', {domain: domain, user: req.user, page: 'editnotification', title: 'Tạo thông báo'});
        } else {
            res.redirect('/');
        }
    });

    app.post('/editnotification', function (req, res) {
        let content = req.body.Noti.content;
        let Tittle = req.body.Noti.Tittle;
        let For = req.body.Noti.For;
        let NotiId = req.body.Noti.NotiId;

        if (req.user.userGroup !== 2) {
            Notification.findByIdAndUpdate(NotiId, {
                Tittle: Tittle,
                content: content,
                For: For
            }, function (err) {
                if (!err) {
                    res.json({result: 1})
                } else {
                    res.json({result: 0, errorMsg: 'Đã xảy ra lỗi không xác định trong quá trình đăng thông báo !'})
                }
            })

        } else {
            res.json({result: 0, errorMsg: 'Bạn không phải là Phòng/Khoa/Ban !'})
        }
    });


};

function timeSince(date) {

    let seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + " năm trước";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + " tháng trước";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + " ngày trước";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " giờ trước";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " phút trước";
    }
    return Math.floor(seconds) + " giây trước";
}

function isLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login');
    }
}
