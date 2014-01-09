//LevelUp, Mark converter and Averager by David Pagurek.
//Code available at https://github.com/pahgawk/LevelUp

//Enumerations
var IGNORE = -1;
var ERROR = -2;

//Shows the specified error message
function throwError(message) {
  document.getElementById("start").className = "no-print hidden";
  document.getElementById("results").className = "hidden";
  document.getElementById("error").className = "no-print";
  document.getElementById("errorMessage").innerHTML = message;
  window.scrollTo(0,0);

  return ERROR;
}

//Conversion table from levels to percentages
var termMarks = {
  "R": {
    "-": 25,
    "": 35,
    "+": 45
  },
  "1": {
    "-": 52,
    "": 55,
    "+": 58
  },
  "2": {
    "-": 62,
    "": 65,
    "+": 68
  },
  "3": {
    "-": 72,
    "": 75,
    "+": 78
  },
  "4": {
    "--": 80,
    "-": 85,
    "": 90,
    "+": 95,
    "++": 100
  },
  "5": {
    "": 100
  },
  "A": {
    "": IGNORE
  },
  "B": {
    "": 0
  }
};

//Converts a level to a percent
function getPercent(str) {

  //Ignore the mark if there's no input
  if (!str) return IGNORE;

  //Removes unnecessary whitespace from CSV
  str = str.trim();

  //If the input was just a whitespace character (now removed), ignore the mark
  if (str === "") return IGNORE;

  //If the mark is written with the operator first (e.g. -4), reverse it (becomes 4-)
  var operators = "+-";
  if (operators.indexOf(str.substring(0, 1))!=-1) str = str.split("").reverse().join("");

  //If the program read in an input that isn't valid, return an error.
  if (termMarks[str.substring(0, 1)] === undefined || termMarks[str.substring(0, 1)][str.substring(1)] === undefined) return throwError("Not a valid level: " + str);

  //Return the corresponding percentage in the table
  return termMarks[str.substring(0, 1)][str.substring(1)];
}

//Class to store student mark data
function Student(lastName, firstName) {
  this.lastName = lastName || "";
  this.firstName = firstName || "";
  this.termMarks = [];
  this.term = 0;
  this.termFinal = 0;
  this.summativeMarks = [];
  this.summative = 0;
  this.examMarks = [];
  this.exam = 0;
  this.oldAvg = 0;
  this.finalAvg = 0;
}

//Parses a CSV from a loadend event and averages marks
function readFile(event) {

  //Show the results part of the page
  document.getElementById("start").className = "no-print hidden";
  document.getElementById("results").className = "";

  //Split CSV into an array lines[row][col]
  var lines = this.result.split("\n");
  var header = [];
  var results = [];

  //Find deliminator being used based on number of occurrences
  var commas = (this.result.match(/,/g) || []).length;
  var semicolons = (this.result.match(/;/g) || []).length;
  var deliminator = (commas>=semicolons)?",":";";

  for (var i=0; i<lines.length; i++) {
    lines[i] = lines[i].split(deliminator);
  }

  //Ignore all lines before the word "Type"
  header = lines.shift();
  while (header[0] != "Type") {
    header = lines.shift();
    if (!header || !header.length || header.length<0) return throwError("Either \"Type\" is missing from the header row or the CSV uses the wrong deliminator.");
  }

  for (var h=0; h<header.length; h++) {
    header[h] = header[h].replace(/(\r\n|\n|\r)/gm,"");
  }

  //Parse student marks
  for (var row=0; row<lines.length; row++) {

    //Ignore blank lines or lines with no marks
    if (lines[row].length<=2) continue;

    //create a new Student and add any marks found in O.A, S, or E columns to their arrays
    var s = new Student(lines[row][0], lines[row][1]);
    for (var col=2; col<header.length; col++) {
      var percent = IGNORE;
      if (header[col].indexOf("O.A")===0 || header[col].indexOf("S")===0 || header[col].indexOf("E")===0) {
        percent = getPercent(lines[row][col]);
      }

      //Stop program on invalid input
      if (percent == ERROR) {
        return;
      } else {
        if (header[col].indexOf("O.A")===0) {
          s.termMarks.push(percent);
        } else if (header[col].indexOf("S")===0 && header[col].length<=2) {
          s.summativeMarks.push(percent);
        } else if (header[col].indexOf("E")===0 && header[col].length<=2) {
          s.examMarks.push(percent);
        }
      }
    }

    //Average all marks in each category, but only if the marks for that category aren't all IGNORE.
    var ignored = 0;
    for (i=0; i<s.termMarks.length; i++) {
      if (s.termMarks[i]>=0) {
        s.term += s.termMarks[i];
      } else {
        ignored++;
      }
    }
    if (ignored == s.termMarks.length) {
      s.term=IGNORE;
    } else {
      s.term /= (s.termMarks.length - ignored);
    }

    ignored=0;
    for (i=0; i<s.summativeMarks.length; i++) {
      if (s.summativeMarks[i]>=0) {
        s.summative += s.summativeMarks[i];
      } else {
        ignored++;
      }
    }
    if (ignored == s.summativeMarks.length) {
      s.summative=IGNORE;
    } else {
      s.summative /= (s.summativeMarks.length - ignored);
    }

    //For the post-exam term mark, if the nth exam mark is larger than the nth
    //term mark, calculate the average using that exam mark rather than the term mark.
    ignored=0;
    for (i=0; i<s.termMarks.length; i++) {
      if (s.examMarks[i] && s.examMarks[i]>s.termMarks[i]) {
        s.termFinal += s.examMarks[i];
      } else {
        if (s.termMarks[i]>=0) {
          s.termFinal += s.termMarks[i];
        } else {
          ignored++;
        }
      }
    }
    if (ignored == s.termMarks.length) {
      s.termFinal=IGNORE;
    } else {
      s.termFinal /= (s.termMarks.length - ignored);
    }

    ignored=0;
    for (i=0; i<s.examMarks.length; i++) {
      if (s.examMarks[i]>=0) {
        s.exam += s.examMarks[i];
      } else {
        ignored++;
      }
    }
    if (ignored == s.examMarks.length) {
      s.exam=IGNORE;
    } else {
      s.exam  /= (s.examMarks.length - ignored);
    }

    //Calculate final average using the post-exam term mark and
    //"old" average using the pre-exam term mark with appropriate
    //sectional weighting
    if (s.summative != IGNORE && s.exam != IGNORE) {
      s.finalAvg = s.termFinal*0.7 + s.summative*0.1 + s.exam*0.2;
      s.oldAvg = s.term*0.7 + s.summative*0.1 + s.exam*0.2;
    } else if (s.summative != IGNORE && s.exam == IGNORE) {
      s.finalAvg = s.termFinal*0.7 + s.summative*0.3;
      s.oldAvg = s.term*0.7 + s.summative*0.3;
    } else if (s.summative == IGNORE && s.exam != IGNORE) {
      s.finalAvg = s.termFinal*0.7 + s.exam*0.3;
      s.oldAvg = s.term*0.7 + s.exam*0.3;
    } else {
      s.finalAvg = s.termFinal;
      s.oldAvg = s.term;
    }

    //Add the student to the list of results
    results.push(s);
  }

  displayStudents(results);
  createCSV(results);
}

//Build a results table
function displayStudents(results) {

  //Make table and header elements
  var table = document.createElement("table");
  table.id="averages";
  var header = document.createElement("tr");
  header.className = "header";

  var studentName = document.createElement("th");
  studentName.innerHTML = "Student";
  studentName.className = "name";
  header.appendChild(studentName);

  var courseAvg = document.createElement("th");
  courseAvg.innerHTML = "Term";
  header.appendChild(courseAvg);

  var courseFinal = document.createElement("th");
  courseFinal.innerHTML = "Term Post-Exam";
  header.appendChild(courseFinal);

  var summative = document.createElement("th");
  summative.innerHTML = "Summative";
  header.appendChild(summative);

  var exam = document.createElement("th");
  exam.innerHTML = "Exam";
  header.appendChild(exam);

  var oldAvg = document.createElement("th");
  oldAvg.innerHTML = "Old Final";
  header.appendChild(oldAvg);

  var finalAvg = document.createElement("th");
  finalAvg.innerHTML = "Final";
  finalAvg.className = "final";
  header.appendChild(finalAvg);

  table.appendChild(header);

  //Add all the students in rows
  for (var i=0; i<results.length; i++) {
    var row = document.createElement("tr");

    var n = document.createElement("td");
    n.className = "name";
    n.innerHTML = results[i].lastName + ", " + results[i].firstName;
    row.appendChild(n);

    var c = document.createElement("td");
    c.innerHTML = (results[i].term != IGNORE) ? (results[i].term.toFixed(2) + "%") : "---";
    row.appendChild(c);

    var c2 = document.createElement("td");
    c2.innerHTML = (results[i].termFinal != IGNORE) ? (results[i].termFinal.toFixed(2) + "%") : "---";
    row.appendChild(c2);

    var s = document.createElement("td");
    s.innerHTML = (results[i].summative != IGNORE) ? (results[i].summative.toFixed(2) + "%") : "---";
    row.appendChild(s);

    var e = document.createElement("td");
    e.innerHTML = (results[i].exam != IGNORE) ? (results[i].exam.toFixed(2) + "%") : "---";
    row.appendChild(e);

    var o = document.createElement("td");
    o.innerHTML = results[i].oldAvg.toFixed(2) + "%";
    row.appendChild(o);

    var f = document.createElement("td");
    f.className = "final";
    f.innerHTML = results[i].finalAvg.toFixed(2) + "%";
    row.appendChild(f);

    table.appendChild(row);
  }

  //Add the elements to the page
  document.getElementById("data").innerHTML = "";
  document.getElementById("data").appendChild(table);
}

//Creates a CSV oout of the results
function createCSV(results) {

  //Create header row
  var csv="Last,First,Term,Term Post-Exam,Summative,Exam,Old Final,Final,\n";

  //Add all the student marks
  for (var i=0; i<results.length; i++) {
    csv+=results[i].lastName + ",";
    csv+=results[i].firstName + ",";
    csv+=results[i].term + ",";
    csv+=results[i].termFinal + ",";
    csv+=((results[i].summative != IGNORE) ? results[i].summative : "---") + ",";
    csv+=((results[i].exam != IGNORE) ? results[i].exam : "---") + ",";
    csv+=results[i].oldAvg + ",";
    csv+=results[i].finalAvg + ",\n";
  }

  //Make the save button link to this file
  document.getElementById("save").href = "data:application/octet-stream;charset=utf-8," + encodeURIComponent(csv);
  document.getElementById("save").download = "AveragedMarks.csv";
}





//Main routine
//
//
//Check if the browser has support for the necessary file reader APIs
if (window.File && window.FileReader && window.FileList && window.Blob) {

  //Listen for drag and click handlers
  document.getElementById("drop").addEventListener("dragenter", dragEvent, false);
  document.getElementById("drop").addEventListener("dragover", dragEvent, false);
  document.getElementById("drop").addEventListener("drop", dragEvent, false);
  document.getElementById("drop").addEventListener("dragleave", dragLeaveEvent, false);
  document.getElementById("file").addEventListener("change", loadFile, false);
  document.getElementById("redo").addEventListener("click", reset, false);
  document.getElementById("redoError").addEventListener("click", reset, false);
  document.getElementById("print").addEventListener("click", printPage, false);

  //Detects if the user is using Internet Explorer.
  //It is used to only show a browse button for Internet Explorer since its
  //drag-and-drap functionality is a bit sketchy.
  if (!!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/MSIE/))) {
    document.getElementById("drop").className = "hidden";
    document.getElementById("olddrop").className = "";
    document.getElementById("file2").addEventListener("change", loadFile, false);
    document.getElementById("save").className = "button hidden";
  }
} else {
  throwError("Your browser does not support file reading capabilities. Try opening this program in a modern browser such as <a href='https://www.google.com/intl/en/chrome/browser/' target='_blank'>Google Chrome.</a>");
}


//Events used by main routine
//
//
//If the drag area is being dragged over, adjust it visually
function dragEvent (event) {
  event.stopPropagation();
  event.preventDefault();
  this.className = "over";

  //If a file has been dropped and it is a CSV file, read the file
  if (event.type == "drop") {
    this.className = "";
    if (event.dataTransfer.files[0].name.indexOf(".csv") != IGNORE) {
      var reader = new FileReader();
      reader.addEventListener("loadend", readFile, false);
      reader.readAsText(event.dataTransfer.files[0]);
    } else {
      throwError("Only upload .csv files, please!");
    }
  }
}

//When a file is dragged over the drag area and leaves, reset its visual style
function dragLeaveEvent(event) {
  this.className = "";
}

//If the user has browsed for a file and it is a valid CSV file, read the file
function loadFile(event) {
  var files = event.target.files;
  if (files.length>0) {
    if (files[0].name.indexOf(".csv") != IGNORE) {
      var reader = new FileReader();
      reader.addEventListener("loadend", readFile, false);
      reader.readAsText(files[0]);
    } else {
      throwError("Only upload .csv files, please!");
    }
  }
}

//Reset the document to open a new file
function reset(event) {
  document.getElementById("start").className = "no-print";
  document.getElementById("results").className = "hidden";
  document.getElementById("error").className = "no-print hidden";
  document.getElementById("errorMessage").innerHTML = "";
  document.getElementById("fileForm").reset();
  document.getElementById("fileForm2").reset();
  window.scrollTo(0,0);
}

//Prints the page. The @media print section of the CSS hides everything but the results
function printPage(event) {
  window.print();
}