	Campground.findById(req.params.id,function(err,foundCampground){
		if(err){
			console.log(err);
		}
		else{
				res.render("campgrounds/edit", {campground: foundCampground});		
		}
	});
	
	<div class="well" style="padding: 2px 15px 2px; border-radius: 7px; border: 2px solid black">
				<% campground.comments.forEach(function(comment){ %>
				<div class="row" style="border-radius: 7px; margin-bottom:0px; padding:5px 0 0 0">
					<div class="col-md-12" style="margin: 0 0 2px 0; padding:0 2px 0 1px">
							<% if(currentUser && comment.author.id.equals(currentUser._id)){ %>
								<strong class="name">You</strong> 
							<% } else { %> 
							<strong class="name"><%=comment.author.username%></strong><% } %>
						    : <%=comment.text%>
						<span class="pull-right"><%= moment(comment.createdAt).fromNow() %></span>
						<% if(currentUser && comment.author.id.equals(currentUser._id)){ %>
							<a class="btn btn-xs btn-warning" href="/campgrounds/<%=campground._id%>/comments/<%=comment._id%>/edit">Edit</a>
							<form class="delete" action="/campgrounds/<%= campground._id%>/comments/<%=comment._id%>?_method=DELETE" method="POST">
								<button class="btn btn-xs btn-danger">Delete</button>
							</form>
						<% } %>
					</div>
				</div>
				<% }) %>
				<div class="text-right" style="margin-right: -13px; margin-top: 15px">
					<a class="btn btn-success btn-sm" href="/campgrounds/<%=campground._id%>/comments/new">Post Comment</a>
				</div>
			</div>