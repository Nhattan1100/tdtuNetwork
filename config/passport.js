const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

module.exports = function (config, passport) {

    //session setup

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    //local authentication
    passport.use('local-login', new LocalStrategy({
            passReqToCallback: true
        },
        function (req, username, password, done) { // callback với email và password từ html form
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            // tìm một user với email
            // chúng ta sẽ kiểm tra xem user có thể đăng nhập không
            User.findOne({'local.Username': username}, function (err, user) {
                if (err) {
                    return done(err, null);
                }
                if (!user) {
                    return done(null, false, req.flash('loginMessage', 'Không tồn tại user !  Vui lòng liên hệ quản trị viên !'));
                }
                if (user.userGroup == 0 && password == user.local.Password) {
                    return done(null, user);
                }

                if (!user.validPassword(password)) {
                    return done(null, false, req.flash('loginMessage', 'Sai mật khẩu !  Vui lòng liên hệ quản trị viên !'));
                }
                return done(null, user);
            });
        })
    );

    //google authentication
    passport.use(new GoogleStrategy({
            clientID: config.googleAuth.clientID,
            clientSecret: config.googleAuth.clientSecret,
            callbackURL: config.googleAuth.callbackURL,
            passReqToCallback: true
        }, function (req, accessToken, refreshToken, profile, done) {
            let email = profile.emails[0].value.split('@')[1];
            if (email === 'student.tdtu.edu.vn') {
                if (profile.id) {
                    User.findOne({'google.id': profile.id}, function (err, user) {
                        if (user && !err) {
                            done(null, user);
                        } else {
                            let newUser = new User({
                                Image: profile.photos[0].value,
                                Name: profile.name.familyName + ' ' + profile.name.givenName,
                                google: {
                                    id: profile.id,
                                    Email: profile.emails[0].value,
                                    Token: accessToken,
                                },
                                userGroup: 2
                            });
                            newUser.save(function (err) {
                                if (err) {
                                    done(err, null);
                                } else {
                                    done(null, newUser);
                                }
                            })
                        }
                    });
                }
            } else {
                return done(null, false, req.flash('loginMessage', 'Vui lòng đăng nhập bằng email sinh viên !'));
            }
        })
    );

}