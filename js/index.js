
if (window.File && window.FileReader && window.FileList && window.Blob) {
  function dragEvent (event) {
    event.stopPropagation(); 
    event.preventDefault();
    this.className = "over";
    if (event.type == "drop") {
      if (event.dataTransfer.files[0].name.indexOf(".csv") != -1) {
        var reader = new FileReader();
        reader.addEventListener("loadend", readFile, false);
        reader.readAsText(event.dataTransfer.files[0]);
      } else {
        this.className = "";
        alert("Only upload .csv files, please!");
      }
    }  
  }
  
  function dragLeaveEvent(event) {
    this.className = "";
  }

  function loadFile(event) {
    var files = event.target.files;
    if (files.length>0) {
      if (files[0].name.indexOf(".csv") != -1) {
        var reader = new FileReader();
        reader.addEventListener("loadend", readFile, false);
        reader.readAsText(files[0]);
      } else {
        alert("Only upload .csv files, please!");
      }
    }
  }

  document.getElementById("drop").addEventListener("dragenter", dragEvent, false);
  document.getElementById("drop").addEventListener("dragover", dragEvent, false);
  document.getElementById("drop").addEventListener("drop", dragEvent, false);
  document.getElementById("drop").addEventListener("dragleave", dragLeaveEvent, false);
  document.getElementById("file").addEventListener("change", loadFile, false)
  document.getElementById("redo").addEventListener("click", reset, false);
} else {
  //no support
}

function reset(event) {
  document.getElementById("start").className = "";
  document.getElementById("results").className = "hidden";
  document.getElementById("fileForm").reset();
}

var marks = {
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
    "": 0
  }
}

function getPercent(str) {
  if (!str) return 0;
  var operators = "+-";
  if (operators.indexOf(str.substring(0, 1))!=-1) str = str.split("").reverse().join("");
  return marks[str.substring(0, 1)][str.substring(1)];
}

function Student(lastName, firstName) {
  this.lastName = lastName || "";
  this.firstName = firstName || "";
  this.marks = [];
  this.summative = 0;
  this.exam = 0;
  this.courseAvg = 0;
  this.finalAvg = 0;
}

function readFile(event) {
  document.getElementById("start").className = "hidden";
  document.getElementById("results").className = "";

  var lines = this.result.split("\n");
  var results = [];
  for (var i=0; i<lines.length; i++) {
    lines[i] = lines[i].split(",");
  }
  var header = lines.shift();
  while (header[0] != "Type") {
    header = lines.shift();
    if (!header.length || header.length<0) return;
  }

  for (row=0; row<lines.length; row++) {
    if (lines[row].length<=1) continue;
    var s = new Student(lines[row][0], lines[row][1]);
    for (col=2; col<header.length; col++) {
      if (header[col]=="O.A") {
        s.marks.push(getPercent(lines[row][col]));
      } else if (header[col]=="S") {
        s.summative = getPercent(lines[row][col]);
      } else if (header[col]=="E") {
        s.exam = getPercent(lines[row][col]);
      }
    }

    for (i=0; i<s.marks.length; i++) {
      s.courseAvg += s.marks[i];
    }
    s.courseAvg /= s.marks.length;
    if (s.summative && s.exam) {
      s.finalAvg = s.courseAvg*0.7 + s.summative*0.1 + s.exam*0.2;
    } else if (s.summative && !s.exam) {
      s.finalAvg = s.courseAvg*0.7 + s.summative*0.3;
    } else if (!s.summative && s.exam) {
       s.finalAvg = s.courseAvg*0.7 + s.exam*0.3;
    } else {
      s.finalAvg = s.courseAvg;
    }

    results.push(s);
  }

  displayStudents(results);
}

function displayStudents(results) {
  var table = document.createElement("table");
  var header = document.createElement("tr");
  header.className = "header";

  var studentName = document.createElement("th");
  studentName.innerHTML = "Student";
  studentName.className = "name";
  header.appendChild(studentName);

  var courseAvg = document.createElement("th");
  courseAvg.innerHTML = "Coursework";
  header.appendChild(courseAvg);

  var summative = document.createElement("th");
  summative.innerHTML = "Summative";
  header.appendChild(summative);

  var exam = document.createElement("th");
  exam.innerHTML = "Exam";
  header.appendChild(exam);

  var finalAvg = document.createElement("th");
  finalAvg.innerHTML = "Final";
  finalAvg.className = "final";
  header.appendChild(finalAvg);

  table.appendChild(header);

  for (var i=0; i<results.length; i++) {
    var row = document.createElement("tr");

    var n = document.createElement("td");
    n.className = "name";
    n.innerHTML = results[i].lastName + ", " + results[i].firstName;
    row.appendChild(n);

    var c = document.createElement("td");
    c.innerHTML = results[i].courseAvg.toFixed(2) + "%";
    row.appendChild(c);

    var s = document.createElement("td");
    s.innerHTML = results[i].summative ? (results[i].summative.toFixed(2) + "%") : "---";
    row.appendChild(s);

    var e = document.createElement("td");
    e.innerHTML = results[i].exam ? (results[i].exam.toFixed(2) + "%") : "---";
    row.appendChild(e);

    var f = document.createElement("td");
    f.className = "final"
    f.innerHTML = results[i].finalAvg.toFixed(2) + "%";
    row.appendChild(f);

    table.appendChild(row);
  }

  document.getElementById("data").innerHTML = "";
  document.getElementById("data").appendChild(table);
}