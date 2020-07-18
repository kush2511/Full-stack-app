require('dotenv').config();
var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var Campground = require("./models/campground");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");
var Comment = require("./models/comment");
var seedDB = require("./seeds");
var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var authRoutes = require("./routes/index");
var methodOverride = require("method-override");
var flash = require("connect-flash");

app.set("view engine","ejs");
mongoose.connect("mongodb://localhost/yelp_camp_v4", {useNewUrlParser:true, useUnifiedTopology:true});
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
//console.log(__dirname);
mongoose.set("useFindAndModify", false);
app.use(require("express-session")({
	secret: "My name is kush",
	resave: false,
	saveUninitialized: false
}));
app.use(flash());
app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.info = req.flash("info");
	next();
})

//seedDB();

app.use(authRoutes);
app.use(campgroundRoutes);
app.use(commentRoutes);

app.listen(process.env.PORT || 3000,process.env.IP,function(){
	console.log("YelpCamp Server has Started..!!");
});