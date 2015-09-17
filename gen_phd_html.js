"use strict";

// https://gist.github.com/RandomEtc/1803645


// first of all make sure we have enough arguments (exit if not)
if (process.argv.length != 5)
{
    console.error("Usage: node gen_phd_html.js input/input.csv template.ejs output/output.html")
    console.error();
    console.error("Outputs the given template for each row in the given input.")
    console.error("Uses the first row of the CSV as column names in the template.")
    process.exit(1);
}

// now load the modules we need
var csv = require('csv');      // library for processing CSV spreadsheet files
var ejs = require('ejs');       // library for turning .ejs templates into .html files
var fs = require('fs');         // node.js library for reading and writing files
var assert = require('assert'); // node.js library for testing for error conditions

var csv_parse = require('csv-parse');
var Promise = require('promise');
var validator = require('validator');

// make sure EJS is configured to use curly braces for templates
ejs.open = '{{';
ejs.close = '}}';

// grab the file names from the command arguments array
// and give them more convenient names
var inputFile = process.argv[2];
var templateFile = process.argv[3];
var outputFile = process.argv[4];

// make sure each file is the right type (exit if not)
assert.ok(inputFile.lastIndexOf('csv') == (inputFile.length - 'csv'.length), "input file should be a .csv file");
assert.ok(templateFile.lastIndexOf('ejs') == (templateFile.length - 'ejs'.length), "template file should be an .ejs file");
assert.ok(outputFile.lastIndexOf('html') == (outputFile.length - 'html'.length), "output file should be an .html file");

// make sure we use the correct line-endings on Windows
var EOL = (process.platform === 'win32' ? '\r\n' : '\n');

// build the template
var template = ejs.compile(fs.readFileSync(templateFile, 'utf8'));

// http://stackoverflow.com/questions/558981/iterating-through-list-of-keys-for-associative-array-in-json
var obj_output = {
  "ai": [],
  "cc": [],
  "ssps": [],
  "shaps": [],
  "soll": []
}; 

//test
var test_output_file = "output/test.txt";

_parse_csv(inputFile).then(function(data){
  // http://nfriedly.com/techblog/2009/06/advanced-javascript-objects-arrays-and-array-like-objects/
 
  var full_name = '';
  var email = '';
  var phone = '';  
  var school = ''; 
  var school_lower = '';

  var research_area = ''; 
  var thesis = ''; 
  var profile = '';

  // http://stackoverflow.com/questions/6260756/how-to-stop-javascript-foreach
  for(var i=0; i < data.length; ++i) {
    var obj = {};

    full_name = data[i][1].trim();
    email = data[i][2].trim();
    phone = data[i][3].trim();  
    school = data[i][4].trim();
    research_area = _get_research_area(data[i]);  
    thesis = data[i][10].trim();
    profile = data[i][11].trim();

    obj.full_name = full_name;
    obj.email = email;
    obj.school = school;
    obj.research_area = research_area;
    obj.thesis = thesis;
    obj.profile = _get_profile(profile, full_name);

    school_lower = obj.school.toLowerCase();
    if(school_lower == "asia institute") {
      obj_output.ai.push(obj);
    }
    else if(school_lower == "school of culture and communication")
    {
      obj_output.cc.push(obj);
    }
    else if(school_lower == "school of social and political sciences") {
      obj_output.ssps.push(obj);
    }
    else if(school_lower == "school of historical and philosophical studies") {
      obj_output.shaps.push(obj);
    }
    else if(school_lower == "school of languages and linguistics") {
      obj_output.soll.push(obj);
    }
    else {
      //console.log('-----else-------');
    }
  }

  // http://stackoverflow.com/questions/24269624/is-javascript-array-sort-asynchronous

  // Sort
  obj_output.ai.sort(_sort_by_first_name);
  obj_output.cc.sort(_sort_by_first_name);
  obj_output.ssps.sort(_sort_by_first_name);  
  obj_output.shaps.sort(_sort_by_first_name);
  obj_output.soll.sort(_sort_by_first_name);

  //test
  /*
  _my_print("");
  _print_name_apen(obj_output.ai);
  _print_name_apen(obj_output.cc);
  _print_name_apen(obj_output.ssps);
  _print_name_apen(obj_output.shaps);
  _print_name_apen(obj_output.soll);
  */

  // Write
  _write_html(obj_output);
  

},function(reason){
  console.error(reason); // error;
})


// Define your func
function _parse_csv(file) {
  return new Promise(function (resolve, reject) {
    // Never seen this sturcture.
    var parser = csv_parse({delimiter: ','},
      function (err, data) {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }

        parser.end();

     });

     fs.createReadStream(file).pipe(parser);

  });
}

// http://stackoverflow.com/questions/6712034/sort-array-by-firstname-alphabetically-in-javascript
function _sort_by_first_name(a, b) {
  //test
  //debugger;

  var the_a = a.full_name.split(" ")[0].toLowerCase();
  var the_b = b.full_name.split(" ")[0].toLowerCase();

  if(the_a < the_b)
    return -1;
  if(the_a > the_b)
    return 1;
      
  return 0;
}


function _write_html(data) {
  var buffer = "";

  buffer += _write_html_table(data.ai);
  buffer += _write_html_table(data.cc);
  buffer += _write_html_table(data.ssps); 
  buffer += _write_html_table(data.shaps);
  buffer += _write_html_table(data.soll);

  // Output
  console.log(buffer);
}


function _write_html_table(data) {
  var buffer = '';
  var url_display = '';  
  var full_name_display = '';

  buffer += "<h3>" + data[0].school + "</h3>";
  buffer += "<table>";

  for(var i=0; i < data.length; i++) {
    buffer += "<tr>";
    buffer += data[i].profile;
    buffer += "<td>" + data[i].email  + "</td>";
    buffer += "<td>" + data[i].research_area  + "</td>";
    buffer += "<td>" + data[i].thesis  + "</td>";
    buffer += "</tr>";
  }
  buffer += "</table>";

  return buffer;
}


function _get_research_area(data) {
  var index = 5;
  var len = 5;
  var internal_index = 0;
  var research_area = '';

  // There are 5 research areas across the column.
  for(var i=0; i<len; i++) {
    internal_index = i + index;
    research_area = data[internal_index];

    if(research_area) {
      return research_area;  
    }
    else {
      continue;
    } 
  }

  return research_area;
}

function _get_profile(profile, full_name) {
  /* 
    Sample data:
    * yue.qiu@studio.unibo.it
    * Empty string
    * upi.academia.edu/HaniYulindrasari
    * some random string
    * 
    * https://unimelb.academia.edu/RyanEdwards  
  */  

  var the_return = '';

  // http://www.w3schools.com/jsref/jsref_regexp_test.asp
  if(profile === '') {
    the_return = '<td>' + full_name  + '</td>';

    //console.log("empty");
  }
  else if(validator.isEmail(profile)) {
    the_return = '<td>' + '<a href="' + 'mailto:' + profile + '">' + full_name  + '</a></td>';

    //console.log("email: " + the_return);
  }
  else if(validator.isURL(profile, {require_protocol: true})) {
    the_return = '<td>' + '<a href="' + profile + '">' + full_name  + '</a></td>';

    //console.log("url: " + the_return);
  }
  else if(validator.isURL(profile, {require_protocol: false})) {
    the_return = '<td>' + '<a href="' + 'http://' + profile + '">' + full_name  + '</a></td>';

    //console.log("no proto url: " + the_return);
  }
  else {
    the_return = '<td>' + full_name  + '</td>';

    //console.log("else set empty: " + profile)
  }

  return the_return;
}


function _print_name_apen(data) {
  _my_apen_write(test_output_file, "\n-start-\n");
  for(var i=0; i < data.length; ++i) {
    _my_apen_write(test_output_file, data[i].full_name + "\n");
  }
  _my_apen_write(test_output_file, "\n-end-\n");
  _my_apen_write(test_output_file, "\n\n");
}

function _my_apen_write(file_name, data) {
  fs.appendFile(file_name, data, function(err) {
    if (err) throw err;
  });
}

function _my_print(data) {
  _my_write(test_output_file, data);
}

function _my_write(file_name, data) {
  fs.writeFile(file_name, data, function(err) {
    if (err) throw err;
  });
}
