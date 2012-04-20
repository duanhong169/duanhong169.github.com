var $=function(a){return document.getElementById(a)};
// If Supports Inline SVG, Display The Social Links
(function(){var a=document.createElement("div");a.innerHTML="<svg/>",(a.firstChild&&a.firstChild.namespaceURI)!="http://www.w3.org/2000/svg"&&($("social-links").style.display="none")})();