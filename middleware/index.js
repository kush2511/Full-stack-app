var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middlewareObj = {};

middlewareObj.checkCommentOwnership = function(req,res,next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err,foundComment){
			if(err){
				console.log(err);
			}
			else{
				//edit / delete only by that original post owner
				if(foundComment.author.id.equals(req.user._id)){
					next();	
				} else {
						res.redirect("back");	
				}
			}
		});
	}
	else{
		res.redirect("back");
	}
};

middlewareObj.checkCampgroundOwnership = function(req,res,next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id,function(err,foundCampground){
			if(err){
				console.log(err);
			}
			else{
				//edit / delete only by that original post owner
				if(foundCampground.author.id.equals(req.user._id)){
					next();	
				} else {
						res.redirect("back");	
				}
			}
		});
	} 
	else{
		res.redirect("back");
	}
};

middlewareObj.isLoggedIn = function(req,res,next){
 	if(req.isAuthenticated()){
		return next();		
	}	
	req.flash("error", "Please Login to do that.");
	res.redirect("/login");
};

module.exports = middlewareObj;