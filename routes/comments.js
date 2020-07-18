var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Add Comment form
router.get("/campgrounds/:id/comments/new",middleware.isLoggedIn,function(req,res){
	//find id of campground
	Campground.findById(req.params.id, function(err,campground){
		if(err){
			console.log(err);
		}
		else{
			res.render("comments/new",{campground: campground});	
		}
	});
});

//Add Comment to the campground
router.post("/campgrounds/:id/comments",middleware.isLoggedIn,function(req,res){
	//find id of campground
	Campground.findById(req.params.id, function(err,campground){
		if(err){
			console.log(err);
		}
		else{
			//console.log(req.body.comment);
			Comment.create(req.body.comment, function(err,comment){
				if(err){
					console.log(err);
				}
				else{
					//username and id of currently logged in user
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//console.log(req.user.username);
					comment.save();
					campground.comments.push(comment);
					campground.save();
					//console.log(comment);
					req.flash("success", "Comment Added Succesfully");
					res.redirect("/campgrounds/" + campground._id);
				}
			});
		}
	});
});

//To Edit comment and show form
router.get("/campgrounds/:id/comments/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
	Comment.findById(req.params.comment_id,req.body.comment,function(err,foundComment){
		if(err){
			console.log(err);
		} else{
			res.render("comments/edit",{campground_id: req.params.id, comment: foundComment});		
		}
	})
});

//update comment
router.put("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err,updatedComment){
		if(err){
			console.log(err);
		} else{
			req.flash("info", "Comment Updated Succesfully");
			res.redirect("/campgrounds/"+ req.params.id);
		}
	});
});

//delete comment
router.delete("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			console.log(err);
		} else{ 
			req.flash("error", "Comment Deleted");
			res.redirect("/campgrounds/"+ req.params.id);
		}
	});
});

module.exports= router;