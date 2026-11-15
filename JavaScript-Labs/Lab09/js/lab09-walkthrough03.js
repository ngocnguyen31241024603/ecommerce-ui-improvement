/* code goes here */
var first = document.getElementById("first");

var text = document.createTextNode("this is programmatically created");
var paragraph = document.createElement("p");
paragraph.appendChild(text);
first.appendChild(paragraph);

var icons = document.getElementById("iconList");
icons.removeChild(document.getElementById("deleteThisOne"));