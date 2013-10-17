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
  document.getElementById("file").addEventListener("change", loadFile, false);
  document.getElementById("redo").addEventListener("click", reset, false);

  /*@cc_on
   @if (@_jscript_version >= 5)
      document.getElementById("drop").className = "hidden";
      document.getElementById("olddrop").className = "";
      document.getElementById("file2").addEventListener("change", loadFile, false);
   @end 
  @*/
} else {
  alert("Please run this program in a more modern browser such as Google Chrome.");
}

function reset(event) {
  document.getElementById("start").className = "";
  document.getElementById("results").className = "hidden";
  document.getElementById("fileForm").reset();
  document.getElementById("fileForm2").reset();
}

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
    "": 0
  },
  "B": {
    "": 0
  }
}

function getPercent(str) {
  if (!str) return 0;
  str = str.trim();
  var operators = "+-";
  if (operators.indexOf(str.substring(0, 1))!=-1) str = str.split("").reverse().join("");
  return termMarks[str.substring(0, 1)][str.substring(1)];
}

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
  this.finalAvg = 0;
}

function readFile(event) {
  document.getElementById("start").className = "hidden";
  document.getElementById("results").className = "";

  var lines = this.result.split("\n");
  var start = [];
  var header = [];
  var results = [];
  for (var i=0; i<lines.length; i++) {
    lines[i] = lines[i].split(",");
  }
  header = lines.shift();
  while (header[0] != "Type") {
    start.push(header);
    header = lines.shift();
    if (!header.length || header.length<0) return;
  }

  for (row=0; row<lines.length; row++) {
    if (lines[row].length<=1) continue;
    var s = new Student(lines[row][0], lines[row][1]);
    for (col=2; col<header.length; col++) {
      if (header[col].indexOf("O.A")==0) {
        s.termMarks.push(getPercent(lines[row][col]));
      } else if (header[col].indexOf("S")==0 && header[col].length<=2) {
        s.summativeMarks.push(getPercent(lines[row][col]));
      } else if (header[col].indexOf("E")==0 && header[col].length<=2) {
        s.examMarks.push(getPercent(lines[row][col]));
      }
    }

    for (i=0; i<s.termMarks.length; i++) {
      s.term += s.termMarks[i];
    }
    s.term /= s.termMarks.length;

    for (i=0; i<s.summativeMarks.length; i++) {
      s.summative += s.summativeMarks[i];
    }
    s.summative /= s.summativeMarks.length;

    for (i=0; i<s.termMarks.length; i++) {
      if (s.examMarks[i] && s.examMarks[i]>s.termMarks[i]) {
        s.termFinal += s.examMarks[i];
      } else {
        s.termFinal += s.termMarks[i];
      }
    }
    s.termFinal /= s.termMarks.length;

    for (i=0; i<s.examMarks.length; i++) {
      s.exam += s.examMarks[i];
    }
    s.exam /= s.examMarks.length;

    if (s.summative && s.exam) {
      s.finalAvg = s.termFinal*0.7 + s.summative*0.1 + s.exam*0.2;
    } else if (s.summative && !s.exam) {
      s.finalAvg = s.termFinal*0.7 + s.summative*0.3;
    } else if (!s.summative && s.exam) {
      s.finalAvg = s.termFinal*0.7 + s.exam*0.3;
    } else {
      s.finalAvg = s.termFinal;
    }

    results.push(s);
  }

  displayStudents(results);
  createCSV(results);
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
    c.innerHTML = results[i].term.toFixed(2) + "%";
    row.appendChild(c);

    var c2 = document.createElement("td");
    c2.innerHTML = results[i].termFinal.toFixed(2) + "%";
    row.appendChild(c2);

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

function createCSV(results) {
  var csv="Last,First,Term,Term Post-Exam,Summative,Exam,Final,\n";
  for (var i=0; i<results.length; i++) {
    csv+=results[i].lastName + ",";
    csv+=results[i].firstName + ",";
    csv+=results[i].term + ",";
    csv+=results[i].termFinal + ",";
    csv+=(results[i].summative ? results[i].summative : "---") + ",";
    csv+=(results[i].exam ? results[i].exam : "---") + ",";
    csv+=results[i].finalAvg + ",\n";
  }
  document.getElementById("save").href = "data:application/octet-stream;charset=utf-8," + encodeURIComponent(csv);
  document.getElementById("save").download = "AveragedMarks.csv";
}