/* 
 * Morpheuz Sleep Monitor
 *
 * Copyright (c) 2013 James Fowler
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*
 * Constants
 */
function mConst() {
	var cfg = {
		awakeAbove : 1000,
		lightAbove : 120,
		sampleIntervalMins : 10,
		vers : 22
	};
	return cfg;
}

function hrsmin(value) {
	var hours = Math.floor(value / 60);
	var minutes = value % 60;
	return fixLen(String(hours)) + ":" + fixLen(String(minutes));
}

/*
 * Some date functions
 */
Date.prototype.format = function(format) // author: meizz
{
	var o = {
		"M+" : this.getMonth() + 1, // month
		"d+" : this.getDate(), // day
		"h+" : this.getHours(), // hour
		"i+" : this.getHours() + 1, // hour + 1
		"m+" : this.getMinutes(), // minute
		"s+" : this.getSeconds(), // second
		"q+" : Math.floor((this.getMonth() + 3) / 3), // quarter
		"S" : this.getMilliseconds()
	// millisecond
	}

	if (/(y+)/.test(format))
		format = format.replace(RegExp.$1, (this.getFullYear() + "")
				.substr(4 - RegExp.$1.length));
	for ( var k in o)
		if (new RegExp("(" + k + ")").test(format))
			format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
					: ("00" + o[k]).substr(("" + o[k]).length));
	return format;
}

Date.prototype.addMinutes = function(minutes) {
	var copiedDate = new Date(this.getTime());
	return new Date(copiedDate.getTime() + minutes * 60000);
}

/*
 * Set a dropdown list to the value
 */
function setSelectedValue(selectObj, valueToSet) {
	for (var i = 0; i < selectObj.options.length; i++) {
		if (selectObj.options[i].text == valueToSet) {
			selectObj.options[i].selected = true;
			return;
		}
	}
}

/*
 * Set a textbox to the value
 */
function setTextValue(selectObj, valueToSet) {
	selectObj.value = fixLen(valueToSet);
}

/*
 * Get a dropdown value
 */
function getSelectedValue(selectObj) {
	return selectObj.options[selectObj.selectedIndex].value;
}

/*
 * Get a textbox value
 */
function getTextValue(selectObj, hour) {
	var value = parseInt(selectObj.value, 10);
	if (isNaN(value) || (hour && (value < 0 || value > 23))
			|| (!hour && (value < 0 || value > 59))) {
		selectObj.style.backgroundColor = 'red';
		return "X";
	}
	return fixLen(String(value));
}

/*
 * Fix a string to 2 characters long prefixing a zero
 */
function fixLen(inStr) {
	if (inStr == null || inStr.length > 1)
		return inStr;
	return '0' + inStr;
}

/*
 * Extract parameters from URL
 */
function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex
			.exec(location.search);
	return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g,
			" "));
}

// Spot if we are on iOS or not
document.ios = navigator.userAgent.match(/iPhone/i)
		|| navigator.userAgent.match(/iPad/i)
		|| navigator.userAgent.match(/iPod/i);

if (document.ios) {
	$(".android").hide();
} else {
	$(".ios").hide();
}

// Pick up parameters from URL
var baseStr = getParameterByName('base');
var base = new Date().valueOf();
if (baseStr != "" && baseStr != 'null') {
	base = parseInt(baseStr, 10);
}
var graph = getParameterByName("graph");
var fromhr = getParameterByName("fromhr");
var frommin = getParameterByName("frommin");
var tohr = getParameterByName("tohr");
var tomin = getParameterByName("tomin");
var smart = getParameterByName("smart");
var inverse = getParameterByName("inverse");
var vers = getParameterByName("vers");
var goneoff = getParameterByName("goneoff");
var emailto = decodeURIComponent(getParameterByName('emailto'));
var xuser = decodeURIComponent(getParameterByName('xuser'));
var xpass = decodeURIComponent(getParameterByName('xpass'));
var xkey = decodeURIComponent(getParameterByName('xkey'));

var smartOn = smart == 'Y';
var inverseOn = inverse == 'Y';

// Set screen fields
document.getElementById('emailto').value = emailto;
document.getElementById('smartalarm').checked = smartOn;
document.getElementById('inverse').checked = inverseOn;

if (document.ios) {
	setSelectedValue(document.getElementById('safromhour'), fromhr);
	setSelectedValue(document.getElementById('safrommin'), frommin);
	setSelectedValue(document.getElementById('satohour'), tohr);
	setSelectedValue(document.getElementById('satomin'), tomin);
} else {
	setTextValue(document.getElementById('safromhourtxt'), fromhr);
	setTextValue(document.getElementById('safrommintxt'), frommin);
	setTextValue(document.getElementById('satohourtxt'), tohr);
	setTextValue(document.getElementById('satomintxt'), tomin);
}

document.getElementById("version").textContent = parseInt(vers, 10) / 10;

if (vers != mConst().vers) {
	document.getElementById('verserror').style.display = 'inline';
}

// Build datasets for the graph
var startPoint = new Date(base);

var splitup = graph.split("!");
var more = new Array();

for (var i = 0; i < splitup.length; i++) {
	if (splitup[i] == '')
		continue;
	var element = new Array();
	element[0] = startPoint;
	element[1] = parseInt(splitup[i], 10);
	if (element[1] < 0)
		element[1] = null;
	more[i] = element;
	startPoint = startPoint.addMinutes(mConst().sampleIntervalMins);
}

// Declare canvas overlay which will be populated as we go on
var canvasOverlayConf = {
	show : false,
	objects : []
};

// Populate with ignore segments
startPoint = new Date(base);
for (var i = 0; i < splitup.length; i++) {
	if (splitup[i] == '')
		continue;
	if (parseInt(splitup[i], 10) == -2) {
		var ignoreOverlay = {
			verticalLine : {
				name : "ignore",
				x : startPoint,
				lineWidth : 5,
				yOffset : 0,
				color : 'rgb(230, 230, 230)',
				shadow : false
			}
		};
		canvasOverlayConf.show = true;
		canvasOverlayConf.objects.push(ignoreOverlay);
	}
	startPoint = startPoint.addMinutes(mConst().sampleIntervalMins);
}

// Work out where the start and stop of the wake-up period should go
if (smartOn) {
	var fromstr = fixLen(fromhr) + fixLen(frommin);
	var tostr = fixLen(tohr) + fixLen(tomin);
	var smartStartPoint = new Date(base);
	var early = null;
	var late = null;
	var actual = null;
	for (var i = 0; i < splitup.length; i++) {
		var teststr1 = smartStartPoint.format("hhmm");
		var smartStartPoint1 = smartStartPoint;
		smartStartPoint = smartStartPoint
				.addMinutes(mConst().sampleIntervalMins);
		var teststr2 = smartStartPoint.format("hhmm");
		if (early == null && fromstr >= teststr1 && fromstr <= teststr2)
			early = smartStartPoint1;
		if (late == null && tostr >= teststr1 && tostr <= teststr2)
			late = smartStartPoint1;
		if (actual == null && goneoff != 'N' && goneoff >= teststr1
				&& goneoff <= teststr2)
			actual = smartStartPoint1;
		if (late != null && early != null && actual != null)
			break;
	}
	if (early != null && late != null) {
		if (actual != null) {
			var canvasOverlayActual = {
				verticalLine : {
					name : "actual",
					x : actual,
					lineWidth : 1,
					yOffset : 0,
					color : 'rgb(255, 149, 0)',
					shadow : false
				}
			};
			canvasOverlayConf.show = true;
			canvasOverlayConf.objects.push(canvasOverlayActual);
		}
		var earlyOverlay = {
			dashedVerticalLine : {
				name : "start",
				x : early,
				lineWidth : 1,
				yOffset : 0,
				dashPattern : [ 1, 4 ],
				color : 'rgb(76, 217, 100)',
				shadow : false
			}
		};
		canvasOverlayConf.show = true;
		canvasOverlayConf.objects.push(earlyOverlay);
		var lateOverlay = {
			dashedVerticalLine : {
				name : "end",
				x : late,
				lineWidth : 1,
				yOffset : 0,
				dashPattern : [ 1, 4 ],
				color : 'rgb(255, 59, 48)',
				shadow : false
			}
		};
		canvasOverlayConf.show = true;
		canvasOverlayConf.objects.push(lateOverlay);
	}
}

// Get the full set of data up to the wake up point.
// Ignore nulls
var pieStartPoint = new Date(base);
var points = 0;
var total = 0;
var awake = 0;
var deep = 0;
var light = 0;
var ignore = 0;
for (var i = 0; i < splitup.length; i++) {
	if (splitup[i] == '')
		continue;
	var data = parseInt(splitup[i], 10);
	var teststr1 = pieStartPoint.format("hhmm");
	var pieStartPoint1 = pieStartPoint;
	pieStartPoint = pieStartPoint.addMinutes(mConst().sampleIntervalMins);
	var teststr2 = pieStartPoint.format("hhmm");
	if (goneoff != 'N' && goneoff >= teststr1 && goneoff <= teststr2)
		break;
	if (data == -1)
		continue;
	if (data == -2) {
		ignore++;
	} else if (data > mConst().awakeAbove) {
		awake++;
	} else if (data > mConst().lightAbove) {
		light++;
	} else {
		deep++;
	}
}

document.getElementById('ttotal').textContent = hrsmin((deep + light + awake + ignore)
		* mConst().sampleIntervalMins);
document.getElementById('tawake').textContent = hrsmin(awake
		* mConst().sampleIntervalMins);
document.getElementById('tlight').textContent = hrsmin(light
		* mConst().sampleIntervalMins);
document.getElementById('tdeep').textContent = hrsmin(deep
		* mConst().sampleIntervalMins);
document.getElementById('tignore').textContent = hrsmin(ignore
		* mConst().sampleIntervalMins);

var data2 = [ [ 'Awake?', awake ], [ 'Light', light ], [ 'Deep', deep ],
		[ 'Ignore', ignore ] ];

// Prepare the graph
$(document).ready(
		function() {

			var plot1 = $.jqplot('chart1', [ more ], {
				grid : {
					background : '#ffffff'
				},
				animate : true,
				canvasOverlay : canvasOverlayConf,
				series : [ {
					showMarker : false,
					breakOnNull : true,
					color : 'rgb(0,122,255)',
					label : new Date(base).format('yyyy-MM-dd'),
					trendline : {
						show : true,
						color : 'rgb(90,200,250)',
						label : '',
						type : 'linear',
						shadow : true,
						lineWidth : 1.5,
						shadowAngle : 45,
						shadowOffset : 1.5,
						shadowDepth : 3,
						shadowAlpha : 0.07
					}
				} ],
				// You can specify options for all axes on the plot at once with
				// the axesDefaults object. Here, we're using a canvas renderer
				// to draw the axis label which allows rotated text.
				axesDefaults : {
					labelRenderer : $.jqplot.CanvasAxisLabelRenderer,
					showTicks : false,
					showTickMarks : false,
				},
				legend : {
					show : true,
					location : 'ne'
				},
				// An axes object holds options for all axes.
				// Allowable axes are xaxis, x2axis, yaxis, y2axis, y3axis, ...
				// Up to 9 y axes are supported.
				axes : {
					// options for each axis are specified in seperate option
					// objects.
					xaxis : {
						renderer : $.jqplot.DateAxisRenderer,
						tickRenderer : $.jqplot.CanvasAxisTickRenderer,
						tickOptions : {
							formatString : '%R',
							angle : -30,
							fontSize : '8pt'
						},
						tickInterval : '1 hour',
						// Turn off "padding". This will allow data point to lie
						// on the
						// edges of the grid. Default padding is 1.2 and will
						// keep all
						// points inside the bounds of the grid.
						pad : 0,
						showTicks : true,
						showTickMarks : true,
						min : new Date(base)
					},
					yaxis : {
						label : "Movement",
						min : -50,
						max : 4000,
					}
				}
			});

			var plot2 = jQuery.jqplot('chart2', [ data2 ], {
				grid : {
					background : '#ffffff'
				},
				seriesColors : [ "rgb(90, 200, 250)", "rgb(0,122,255)",
						"rgb(88,86,214)", "rgb(130,130,130)" ],
				seriesDefaults : {
					// Make this a pie chart.
					renderer : jQuery.jqplot.PieRenderer,
					rendererOptions : {
						// Put data labels on the pie slices.
						// By default, labels show the percentage of the slice.
						showDataLabels : true
					}
				},
				legend : {
					show : true,
					location : 'e'
				}
			});

		});

// Prepare the copy link
var timePoint = new Date(base);
var body = '&body=';
var copyBody = '';

for (var i = 0; i < splitup.length; i++) {
	if (splitup[i] == '')
		continue;
	body = body + timePoint.format('hh:mm') + ',' + splitup[i] + '%0D%0A';
	copyBody = copyBody + timePoint.format('hh:mm') + ',' + splitup[i] + "\r\n";
	timePoint = timePoint.addMinutes(mConst().sampleIntervalMins);
}

// Add smart alarm info into CSV data
if (smartOn) {
	body = body + fromhr + ':' + frommin + ',START%0D%0A' + tohr + ':' + tomin
			+ ',END%0D%0A';
	copyBody = copyBody + fromhr + ':' + frommin + ',START\r\n' + tohr + ':'
			+ tomin + ',END\r\n';
	if (goneoff != 'N') {
		var goneoffstr = goneoff.substr(0, 2) + ':' + goneoff.substr(2, 2);
		body = body + goneoffstr + ',ALARM%0D%0A';
		copyBody = copyBody + goneoffstr + ',ALARM\r\n';
	}
}

var mailto = '?subject=Morpheuz-' + new Date(base).format('yyyy-MM-dd')
		+ '.csv' + body;

document.getElementById('mailtemp').value = mailto;
document.getElementById('mail').href = 'mailto:' + emailto + mailto;
document.getElementById('copy').value = copyBody;

$("#copy").focus(function() {
	var $this = $(this);
	$this.select();

	// Work around Chrome's little problem
	$this.mouseup(function() {
		// Prevent further mouseup intervention
		$this.unbind("mouseup");
		return false;
	});
});

// Change the mailto 
document.getElementById('emailto').onchange = function() {
	var mailtemp = document.getElementById('mailtemp').value;
	var emailto = document.getElementById('emailto').value;
	document.getElementById('mail').href = 'mailto:' + emailto + mailtemp;
}

// Handle the Save and reset option
document.getElementById('reset').onclick = function() {
	var smartpart = document.getElementById('smartalarm').checked ? 'Y' : 'N';
	var inversepart = document.getElementById('inverse').checked ? 'Y' : 'N';
	var emailpart = encodeURIComponent(document.getElementById('emailto').value);
        var xuserpart = "";
        var xpasspart = "";
        var xkeypart = "";
	var fromhrpart = "";
	var fromminpart = "";
	var tohrpart = "";
	var tominpart = "";
	if (document.ios) {
		fromhrpart = getSelectedValue(document.getElementById('safromhour'));
		fromminpart = getSelectedValue(document.getElementById('safrommin'));
		tohrpart = getSelectedValue(document.getElementById('satohour'));
		tominpart = getSelectedValue(document.getElementById('satomin'));
	} else {
		fromhrpart = getTextValue(document.getElementById('safromhourtxt'),
				true);
		fromminpart = getTextValue(document.getElementById('safrommintxt'),
				false);
		tohrpart = getTextValue(document.getElementById('satohourtxt'), true);
		tominpart = getTextValue(document.getElementById('satomintxt'), false);
		if (fromhrpart == "X" || fromminpart == "X" || tohrpart == "X"
				|| tominpart == "X")
			return;
	}

	if ((fromhrpart + ":" + fromminpart) >= (tohrpart + ":" + tominpart)) {
		document.getElementById('safromhour').style.backgroundColor = 'red';
		document.getElementById('safrommin').style.backgroundColor = 'red';
		document.getElementById('satohour').style.backgroundColor = 'red';
		document.getElementById('satomin').style.backgroundColor = 'red';
		document.getElementById('safromhourtxt').style.backgroundColor = 'red';
		document.getElementById('safrommintxt').style.backgroundColor = 'red';
		document.getElementById('satohourtxt').style.backgroundColor = 'red';
		document.getElementById('satomintxt').style.backgroundColor = 'red';
	} else {
		window.location.href = 'pebblejs://close#reset' + '!' + smartpart + '!'
				+ fromhrpart + '!' + fromminpart + '!' + tohrpart + '!'
				+ tominpart + '!' + inversepart + '!' + emailpart + '!'
                                + xuserpart + '!' + xpasspart + '!' + xkeypart;
	}
}
