var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'kush2511', 
  api_key: "742446324268285", 
  api_secret: "mMuLxLpMN26MXjS0Yb0nRVfam-4"
});

router.get("/",function(req,res){
	res.render("landing");
});

router.get("/campgrounds",function(req,res){
	//get all campgrounds from db
	Campground.find({}, function(err,allCampgrounds){
		if(err){
			console.log(err);
		}
		else{
			//console.log("Found data from db");
			//console.log(allCampgrounds);
			res.render("campgrounds/index",{campgrounds: allCampgrounds, page:"campgrounds"});	
		}
	});
});

//To add a new campground
router.get("/campgrounds/new",middleware.isLoggedIn,function(req,res){
	res.render("campgrounds/new");
});

// router.post("/campgrounds",middleware.isLoggedIn, upload.single('image'),function(req,res){
// 	var name = req.body.name;
// 	var price = req.body.price;
// 	var image = req.body.image;
// 	var desc = req.body.description;
// 	var author = {
// 		id : req.user._id,
// 		username : req.user.username,
// 	}
// 	var newCampground = {name: name,price: price,image: image, description: desc, author: author};
// 	//console.log(req.user);
	
// 	//Create a new campground and save to db
// 	Campground.create(newCampground, function(err,newlyCreated){
// 		if(err){
// 			console.log(err);
// 		}
// 		else{
// 			//console.log("Data Added to db");
// 			//console.log(newlyCreated);
// 			res.render("campgrounds/show",{campground: newlyCreated, info : "Campground Added Successfully"});		
// 		}
// 	});
// });

router.post("/campgrounds",middleware.isLoggedIn, upload.single('image'),function(req,res){
	cloudinary.v2.uploader.upload(req.file.path, function(err,result) {
	  //console.log(result);
	  // add cloudinary url for the image to the campground object under image property
	  req.body.campground.image = result.secure_url;
	  req.body.campground.imageId = result.public_id;
	  // add author to campground
	  req.body.campground.author = {
		id: req.user._id,
		username: req.user.username
	  }
	  Campground.create(req.body.campground, function(err, newlyCreated) {
		if (err) {
		  console.log(err);
		}
		// res.redirect('/campgrounds/' + campground.id);
		  res.render("campgrounds/show",{campground: newlyCreated, info : "Campground Added Successfully"});
	  });
	});
});

router.get("/campgrounds/:id",function(req,res){
	//find the campground with selected id
	Campground.findById(req.params.id).populate("comments likes").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		}
		else{
			//console.log(foundCampground);
			//render show template with that campground
			res.render("campgrounds/show",{campground: foundCampground});
		}
	});
});

//Edit Form
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership,function(req,res){
	Campground.findById(req.params.id,function(err,foundCampground){
		if(err){
			console.log(err);
		}
		else{
			res.render("campgrounds/edit", {campground: foundCampground});		
		}
	});
});

//Update
// router.put("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
// 	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err,updatedCampground){
// 		if(err){
// 			console.log(err);
// 		}
// 		else{
// 			req.flash("info","Campground Updated Successfully");
// 			res.redirect("/campgrounds/" + req.params.id);
// 		}
// 	});
// });
router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res){
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.name;
            campground.description = req.body.description;
			campground.price = req.body.price;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// Campground Like Route
router.post("/campgrounds/:id/like", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});

//Delete Post
// router.delete("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
// 	Campground.findByIdAndRemove(req.params.id, function(err){
// 		if(err){
// 			console.log(err);
// 		}
// 		else{
// 			req.flash("error","Your Campground Is Deleted");
// 			res.redirect("/campgrounds")
// 		}
// 	});
// });
router.delete('/campgrounds/:id',middleware.checkCampgroundOwnership, function(req, res) {
  Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(campground.imageId);
        campground.remove();
        req.flash('error', 'Your Campground deleted successfully!');
        res.redirect('/campgrounds');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

module.exports= router;