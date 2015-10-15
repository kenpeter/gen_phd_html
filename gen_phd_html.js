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
var natural = require('natural');

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
  "shaps": [],
  "soll": [],
  "ssps": [],
  "total": [] // This stores everything
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
    // Skip the first row, as they are titles.
    if(i === 0) {
      continue;
    }

    // If full_name is empty, then assume the entire row is empty.
    if(!data[i][1].trim()) {
      continue;
    }

    var obj = {};

    full_name = data[i][1].trim();
    email = data[i][2].trim();
    phone = data[i][3].trim();  
    school = data[i][4].trim();
    research_area = _get_research_area(data[i]);  
    thesis = data[i][10].trim();
    profile = data[i][12].trim();

    obj.full_name = _destill_full_name(i, full_name);
    obj.email = email;
    obj.school = school;
    obj.research_area = research_area;
    obj.thesis = thesis;
    obj.profile = _get_profile(i, profile, full_name);

    school_lower = obj.school.toLowerCase();


    /*
    if(school_lower == "asia institute") {
      if(!_is_existed(obj_output.ai, obj.full_name)) {
        obj_output.ai.push(obj);
      }
    }
    else if(school_lower == "school of culture and communication")
    {
      if(!_is_existed(obj_output.cc, obj.full_name)) {
        obj_output.cc.push(obj);
      }
    }
    else if(school_lower == "school of social and political sciences") {
      if(!_is_existed(obj_output.ssps, obj.full_name)) {
        obj_output.ssps.push(obj);
      }
    }
    else if(school_lower == "school of historical and philosophical studies") {
      if(!_is_existed(obj_output.shaps, obj.full_name)) {
        obj_output.shaps.push(obj);
      }
    }
    else if(school_lower == "school of languages and linguistics") {
      if(!_is_existed(obj_output.soll, obj.full_name)) {
        obj_output.soll.push(obj);
      }
    }
    else {
      //console.log('-----else-------');
    }
    */

    if(_is_existed(i, obj_output.total, obj) > 0) {

    }
    else {
      
    }

    // Push to total array
    obj_output.total.push(obj);

  } // End for loop

  // http://stackoverflow.com/questions/24269624/is-javascript-array-sort-asynchronous

  // Sort
  obj_output.ai.sort(_sort_by_first_name);
  obj_output.cc.sort(_sort_by_first_name);
  obj_output.ssps.sort(_sort_by_first_name);  
  obj_output.shaps.sort(_sort_by_first_name);
  obj_output.soll.sort(_sort_by_first_name);

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
  buffer += _write_html_table(data.shaps);
  buffer += _write_html_table(data.soll);
  buffer += _write_html_table(data.ssps);

  // Output
  console.log();
  //console.log("Needed html");
  //console.log(buffer);
  console.log();
}


function _write_html_table(data) {
  var buffer = '';

  if(data.length > 0) {
    var url_display = '';  
    var full_name_display = '';

    buffer += "<h3 class='school-title'>" + data[0].school + "</h3>";
    buffer += "<table class='table-student'>";

    // Header  
    buffer += "<tr>";
    buffer += "<th>Full name</th>";
    buffer += "<th>Email</th>";
    buffer += "<th>Research area</th>";
    buffer += "<th>Thesis</th>";
    buffer += "</tr>";

    for(var i=0; i < data.length; i++) {
      buffer += "<tr>";
      buffer += data[i].profile;
      buffer += "<td>" + data[i].email  + "</td>";
      buffer += "<td>" + data[i].research_area  + "</td>";
      buffer += "<td>" + data[i].thesis  + "</td>";
      buffer += "</tr>";
    }
    buffer += "</table>";
  }
  else {
    buffer = '';
  }

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

function _get_profile(row_index, profile, full_name) {
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
    // It turns out, we only care external url, not email.
    //the_return = '<td>' + '<a href="' + 'mailto:' + profile + '">' + full_name  + '</a></td>';
    the_return = '<td>' + full_name  + '</td>';

    //console.log("email: " + the_return);
  }
  else if(validator.isURL(profile, {require_protocol: true})) {
    if(_is_url_we_want(row_index, profile)) {
      the_return = '<td>' + '<a href="' + profile + '">' + full_name  + '</a></td>';
    }
    else {
      the_return = '<td>' + full_name  + '</td>';
    }

    //console.log("url: " + the_return);
  }
  else if(validator.isURL(profile, {require_protocol: false})) {
    if(_is_url_we_want(row_index, profile)) {
      the_return = '<td>' + '<a href="' + 'http://' + profile + '">' + full_name  + '</a></td>';
    }
    else {
      the_return = '<td>' + full_name  + '</td>';  
    }

    //console.log("no proto url: " + the_return);
  }
  else {
    the_return = '<td>' + full_name  + '</td>';

    //console.log("else set empty: " + profile)
  }

  return the_return;
}


function _is_existed(row_index, my_array, my_obj) {
  /*
    If full name is duplicated, we don't check other things. 
    It just returns once found.
  */

  var _count = 0;
  var _msg = '';  

  console.log();
  // Check full name
  if(_is_full_name_dup(my_array, my_obj)) {
    ++_count;
  }

  // Check email
  if(_is_email_dup(my_array, my_obj)) {
    ++_count;
  }  

  // Summary similarity
  if(_count > 0) {
    ++row_index; // It counts from 0
    _msg = "Summary: row " + row_index + " has " + _count + ' similarities';
    console.log(_msg);
    console.log();
  }

  return _count;
}

function _is_full_name_dup(my_array, my_obj) {
  var _full_name;
  var _distance;
  var _my_text = my_obj.full_name;

  var _msg = '';  
  var _condi = false;  

  for(var i=0; i<my_array.length; i++) {
    _full_name = my_array[i].full_name;

    // https://github.com/NaturalNode/natural
    _distance = natural.JaroWinklerDistance(_full_name, _my_text);
  
    if(_distance >= 0.6) {
      _msg = "Full name similarity: " + _my_text + " | distance: " + _distance; 
      console.log(_msg);

      // Leave now
      return _condi = true;
    }
  }

  return _condi;
}


function _is_email_dup(my_array, my_obj) {
  var _array_text;
  var _distance;
  var _my_text = my_obj.email;

  var _msg = '';  
  var _condi = false;  

  for(var i=0; i<my_array.length; i++) {
    _array_text = my_array[i].email;

    // https://github.com/NaturalNode/natural
    _distance = natural.JaroWinklerDistance(_array_text, _my_text);
  
    if(_distance >= 0.6) {
      _msg = "Email similarity: " + _my_text + " | distance: " + _distance; 
      console.log(_msg);

      // Leave now
      return _condi = true;
    }
  }

  return _condi;
}


function _destill_full_name(row_index, full_name) {
  // http://stackoverflow.com/questions/9932957/javascript-remove-character-from-a-string
  var the_return = '';
   
  var orig_full_name = full_name;
  var title = /^Mr\s*/gi;
  var _msg = '';
  
  // http://stackoverflow.com/questions/6603015/check-whether-a-string-matches-a-regex
  if(title.test(full_name)) {
    the_return = full_name.replace(title, '');
    _msg = "Summary: row " + row_index + " - Old name: " + orig_full_name 
      + " | " + "New name: " + the_return;
    console.log(_msg);
  }
  else {
    the_return = full_name;
  }

  return the_return;
}


function _is_url_we_want(row_index, url) {
  var orig_url = url;
  var condi = true;
  var _msg = '';

  /*
    Sample data not what we want

    * https://www.academia.edu
    * www.academia.edu
    * http://www.linkedin.com/hp/?dnr=q1HKzUxwJqMGTFjSdgquzjats9MGTFF8f5CJ

  */

  if(/^https?:\/\/www\.academia\.edu$/.test(url)) {
    //console.log("not wanted url: " + url);
    condi = false;    
  }
  else if(/^www\.academia\.edu$/.test(url)) { 
    //console.log("not wanted url: " + url);
    condi = false;
  }
  else if(/^https?:\/\/www\.linkedin\.com\/hp\/\?dnr=q1HKzUxwJqMGTFjSdgquzjats9MGTFF8f5CJ$/.test(url)) {
    //console.log("not wanted url: " + url);
    condi = false;
  }
  else {
    condi = true;
  }

  ++row_index;
  _msg = "Summary: row " + row_index + " not wanted url, " +  url;  

  console.log();  
  console.log(_msg);
  console.log();

  return condi;
}
