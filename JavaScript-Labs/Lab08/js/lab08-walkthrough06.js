/* add code below this */
var stringOne = new String("Test");
var stringTwo = "Test";

document.write("typeof stringOne = " + typeof stringOne + "<br>");
document.write("typeof stringTwo = " + typeof stringTwo + "<br>");
document.write("stringOne == stringTwo: " + (stringOne == stringTwo) + "<br>");
document.write("stringOne === stringTwo: " + (stringOne === stringTwo));
var stringThree = new String("Test");

document.write("<br>stringOne == stringThree: " + (stringOne == stringThree));
document.write("<br>stringOne === stringThree: " + (stringOne === stringThree));
var today = new Date();

document.write("<br><br>Current date and time: " + today);
document.write("<br>Math.PI = " + Math.PI);
document.write("<br>Math.sqrt(4) = " + Math.sqrt(4));
document.write("<br>Math.random() = " + Math.random());