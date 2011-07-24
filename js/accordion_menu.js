$(document).ready(function(){
	//SideNav
		$("#side-nav li ul").hide(); // Hide all sub menus
		$("#side-nav li a.current").parent().find("ul").slideToggle("slow"); 		
		$("#side-nav li a.parent").click( 
			function () {
				$(this).parent().siblings().find("ul").slideUp("normal"); 
				$(this).next().slideToggle("normal"); 
				return false;
			}
		);
		
	//SideNav Parent Link
		$("#side-nav li a.no-child").click( 
			function () {
				window.location.href=(this.href);
				return false;
			}
		); 

    // SideNav Hover Effect
		
		$("#side-nav li a").hover(
			function () {
				$(this).stop().animate({ paddingRight: "25px" }, 200);
			}, 
			function () {
				$(this).stop().animate({ paddingRight: "15px" });
			}
		);
});
  
  
  