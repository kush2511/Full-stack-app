var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground")
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//Register page
router.get("/register",function(req,res){
	res.render("register",{page:"register"});
});

//Register logic
router.post("/register",function(req,res){
	    var newUser = new User({
        username: req.body.username,
        email: req.body.email
      });
	//var newUser = new User({username: req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			// console.log(err);
			// return res.render("register", {error: err.message});
			req.flash("error", err.message);
			return res.redirect("/register");
			// console.log(err);
			// return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success", "Account Created");
			res.redirect("/campgrounds");
		});
	});
});

//Login page
router.get("/login",function(req,res){
	res.render("login",{page:"login"});
});

//Login logic
router.post("/login",passport.authenticate("local",
	{
		successRedirect : "/campgrounds",
		failureRedirect : "/login",
		failureFlash: true,
	    successFlash: 'Welcome back..!'
	}),function(req,res){
});

//logout
router.get("/logout",function(req,res){
	req.logout();
	req.flash("info", "You Logged Out...!!!")
	res.redirect("/campgrounds");
});

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 900000; // 15min.

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'learncoding813@gmail.com',
          pass: "mehta@1234"
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'learncoding813@gmail.com',
        subject: 'Password Reset',
        text: 'You are receiving this because you have requested to change password for your account and please note that the link will expires in 15 minutes.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this then let us know and, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to "' + user.email + '" with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password link has expired. Please try again later..!');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "New & Confirm Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'learncoding813@gmail.com',
          pass: "mehta@1234"
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'learncoding813@gmail.com',
        subject: 'Password has been Changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account "' + user.email + '" has just been changed. If you did not change your Password then let us know.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

module.exports= router;