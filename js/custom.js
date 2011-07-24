/* Image Preloader  -----------------------------------------------------------*/

$(function () {
  var img = new Image();
  
  $(img)
    .load(function () {
      $(this).hide();
       $('loading')
        .removeClass('loading')
        .append(this);
   
      $(this).fadeIn();
    })
    
    .error(function () {
    })
    
    .attr('src', '');
});

/* Image Hover Classes  -----------------------------------------------------------*/

$(document).ready(function(){
	$("a[rel^='prettyPhoto']").each(function() {	
		var $image = $(this).contents("img");
			$hoverclass = 'hover_video';

	if($(this).attr('href').match(/(jpg|gif|jpeg|png|tif)/)) 
	$hoverclass = 'hover_image';
		
	if ($image.length > 0)
	{	
		var $hoverbg = $("<span class='"+$hoverclass+"'></span>").appendTo($(this));
		
			$(this).bind('mouseenter', function(){
			$height = $image.height();
			$width = $image.width();
			$pos =  $image.position();		
			$hoverbg.css({height:$height, width:$width, top:$pos.top, left:$pos.left});
		});
	}

});	

/* ImageHover Opacity  -----------------------------------------------------------*/

$("a[rel^='prettyPhoto']").contents("img").hover(function() {
		$(this).stop().animate({"opacity": "0.2"}, 400);
		},function() {
		$(this).stop().animate({"opacity": "1"},400);
	});
});



/* Functins CallBack  -----------------------------------------------------------*/

$(window).load(function() {	
		$('ul.social li a').tipsy({gravity: 's'});
		sys_toggle();
		sys_menu();		
		$('.scroll-pane').jScrollPane();
});

$(window).resize(function() {
  $('.scroll-pane').jScrollPaneRemove();
  $('.scroll-pane').jScrollPane();
});

/* jQuery Custom Menu -----------------------------------------------------------*/

function sys_menu() {
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
}
  
/* jQuery Toggle   -----------------------------------------------------------*/

function sys_toggle() {
	$(".toggle_content").hide();

	$("h5.toggle").toggle(function(){
		$(this).addClass("active");
		}, function () {
		$(this).removeClass("active");
	});

	$("h5.toggle").click(function(){
		$(this).next(".toggle_content").slideToggle();
	});
}

/* jQuery Cufon Fonts -----------------------------------------------------------*/

Cufon.replace('h1, h2, h3, h4, h5, h6, p.simple,', { hover:true });
