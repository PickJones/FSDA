
////////////////////////////////////////////////////////////////////////////////////
// Vars
////////////////////////////////////////////////////////////////////////////////////

var selectedView = getCookie("selectedView") || "r";
var playerArray = [[]];
var players = [{}];
var positions = {};
var sources = {};
var nonDefaultPositionCnt = 0;
var defaultPositionRank = {
  QB:1
 ,RB:2
 ,WR:3
 ,TE:4
 ,K:5
 ,IDP:6
 ,Def:7
};

$(function() {
  window.onload = toggleView(selectedView);
  $('#srchbox').keyup(function() { doSearch($('#srchbox').val()); });
  $('#rankcsv').bind('change', prepareDA);
  $('#aDraftTool').bind('click', function() { toggleView("p"); });
  $('#aSourceWeights').bind('click', function() { toggleView("r"); });
});

////////////////////////////////////////////////////////////////////////////////////
// Display (both)
////////////////////////////////////////////////////////////////////////////////////

function prepareTables() {
  $('#output').append('prepareTables()<br>');
  
  /////////////////////////////////////
  //source weights
  var rth = '<tr>';
  rth += '<th valign="top" align="center"><b>Name</b></th>';
  rth += '<th valign="top" align="center"><b>Team</b></th>';
  rth += '<th align="center"><b>Position</b>';
  rth += "<br><select id=\"sFilterRanks\" onchange=\"filterRanks()\">";
  rth += '<option value="All">All</option>';
  for (var pos in positions) {
    rth += '<option value="' + pos + '">' + pos + '</option>';
  }
  rth += '</select></th>';
  rth += '<th valign="top" align="center"><b>Avg</b></th>';
  rth += '<th valign="top" align="center"><b>Rank</b></th>';
  var rcnt = 0;
  for (var src in sources) {
    rth += '<th align="center">'
    rth += '<b>' + sources[src]['name'] + '</b>';
    rth += "<br><input type=\"number\" value=\"" + sources[src]['weight'] + "\" id=\"wt" + sources[src]['col'] + "\" style=\"width: 3em\" onchange=\"changeWeight('" + sources[src]['col'] + "')\">";
    rth += '</th>';
    rcnt++;
  }
  rth += '</tr>';
  $('#tRanks thead').html(rth);

  /////////////////////////////////////
  //draft tool
  var th = '<tr>';
  var tb = '<tr>';
  var cnt = 0;
  for (var p in positions) {
    th += '<th id="thStatusSTATUS' + p + '" align="center" ';
//      th += 'draggable="true" ';
//      th += 'ondragstart="positionDrag(event)" ';
//      th += 'ondragover="positionAllow(event)" ';
//      th += 'ondrop="positionDrop(event)" ';
    th += '><b>' + p + '</b></th>';
    tb += '<td valign="top"><table id="tStatusSTATUS' + p + '"><tbody></tbody></table></td>';
    cnt++;
  }
  th += '</tr>'
  tb += '</tr>'
  $('#tStatusM thead').html(th.replace(/STATUS/g, 'M'));
  $('#tStatusM tbody').html(tb.replace(/STATUS/g, 'M'));
  $('#tStatusA thead').html(th.replace(/STATUS/g, 'A'));
  $('#tStatusA tbody').html(tb.replace(/STATUS/g, 'A'));
  $('#tStatusT thead').html(th.replace(/STATUS/g, 'T'));
  $('#tStatusT tbody').html(tb.replace(/STATUS/g, 'T'));
  $('#output').append('END prepareTables()<br>');
} //prepareTables

function displayPlayers(spos) {
  $('#output').append('displayPlayers(' + players.length + ')<br>');
  for (var pos in positions) {
    $('#tStatusA' + pos + ' tbody').empty();
    positions[pos]['A']=0;
    $('#tStatusM' + pos + ' tbody').empty();
    positions[pos]['M']=0;
    $('#tStatusT' + pos + ' tbody').empty();
    positions[pos]['T']=0;
  }
  $('#tRanks tbody').empty();
  var rcnt = 1;
  var rrow = '';
  for (var row in players) {
    positions[players[row].position][players[row].status]++;
    $('#tStatus' + players[row].status + players[row].position + ' tbody').append(getDraftToolRow(positions[players[row].position][players[row].status], players[row], 0));
    rrow = getSourceWeightRow(players[row],spos,rcnt);
    $('#tRanks tbody').append(rrow);
    if (rrow != '') { rcnt++; }
  }
  $('#output').append('END displayPlayers()<br>');
} //displayPlayers

function getDraftToolRow(c, p, s) {
  var ret = '';
  var icn = '';
  icn += "<img src=\"../img/ICON\" ";
  icn += "height=\"15\" width=\"15\" ";
  icn += "onclick=\"changeStatus('" + p['unq'] + "', 'STATUS')\">&nbsp;&nbsp;";
  if ( !(c%2)) { 
    ret += '<tr bgcolor="#d3d3d3"><td>'; 
  } else {
    ret += '<tr><td>';
  }
  if (p['status'] != "M") {
    ret += icn.replace('ICON','check.png').replace('STATUS','M');
  }
  if (p['status'] != "T") {
    ret += icn.replace('ICON','x.png').replace('STATUS','T');
  }
  if (p['status'] != "A") {
    ret += icn.replace('ICON','clear.jpg').replace('STATUS','A');
  }
  ret += ((s == 1) ? p.rank : p.rank) + '&nbsp;' + p.name + '&nbsp;(<i>' + p.team + '</i>)</td></tr>';
  return ret;
} //getDraftToolRow

function getSourceWeightRow(p, pos, c) {
  var ret = '';
  if (pos == "All" || pos == p['position']) {
    if ( !(c%2)) { 
      ret += '<tr bgcolor="#d3d3d3">'; 
    } else {
      ret += '<tr>';
    }
    ret += '<td>' + p['name'] + '</td>';
    ret += '<td>' + p['team'] + '</td>';
    ret += '<td>' + p['position'] + '</td>';
    ret += '<td align="center">' + Math.round(100*p['calcavg'])/100 + '</td>';
    ret += '<td align="center">' + p['rank'] + '</td>';
    ret += "<td><input type=\"number\" value=\"" + p['src0'] + "\" id=\"rk" + p['unq'] + "\" style=\"width: 3em\" onchange=\"changeUserRank('" + p['unq'] + "')\"></td>";
    for (var src in sources) {
      if (src != '0') {
        if (p['src'+src]) {
          ret += '<td align="center">' + p['srcposrk'+src] + '</td>';
        } else {
          ret += '<td></td>';
        }
      }
    }
    ret += '</tr>'
  }
  return ret;
} //getSourceWeightRow

////////////////////////////////////////////////////////////////////////////////////
// Interact
////////////////////////////////////////////////////////////////////////////////////

function toggleView(w) {
  $('#output').append('toggleView(' + selectedView + ')<br>');
  selectedView = w;
  setCookie("selectedView", selectedView);
  if (w == "p") {
    $('#dPlayerRank').hide();
    $('#dSelectionHistory').show();
  } else {
    $('#dSelectionHistory').hide();
    $('#dPlayerRank').show();
  }
  $('#output').append('END toggleView(' + selectedView + ')<br>');
} //toggleView

function doSearch(s) {
  $('#tSearchResults tbody').empty();
  if (event.keyCode == 13) {
    srchterm="";
    $('#srchbox').val(srchterm);
  } else {
    srchterm = s;
  }
  if (srchterm.length > 0) {
    var cnt = 0;
    for (var row in players) {
      if (players[row]['name'].toUpperCase().indexOf(srchterm.toUpperCase()) >= 0) {
        cnt++;
        $('#tSearchResults tbody').append(getDraftToolRow(cnt, players[row], 1));
      }
    }
  }
} //doSearch

function changeStatus(u, s) {
  for (var row in players) {
    if (players[row]['unq'] == u) {
      $('#output').append('updaing ' + players[row]['name'] + '<br>');
      var os = players[row]['status'];
      players[row]['status'] = s;
      setCookie('Status'+players[row]['unq'], s);
      $('#tdLastAction5').html($('#tdLastAction4').html());
      $('#tdLastAction4').html($('#tdLastAction3').html());
      $('#tdLastAction3').html($('#tdLastAction2').html());
      $('#tdLastAction2').html($('#tdLastAction1').html());
      $('#tdLastAction1').html('<table>' + getDraftToolRow(1, players[row], 1) + '</table>');
    }
  }
  setTimeout(function() {
    displayPlayers($('#sFilterRanks').val());
  },500);
  $('#srchbox').val('');
  doSearch('');
  $('#srchbox').focus();
} //changeStatus

function changeWeight(s) {
  var newwt = $('#wt' + s).val();
  sources[s]['weight'] = newwt;
  rerankPlayers();
  displayPlayers($('#sFilterRanks').val());
  setCookie('src'+s, newwt);
} //changeWeight

function changeUserRank(u) {
  var newrk = $('#rk' + u).val();
  for (var row in players) {
    if (players[row]['unq'] == u) {
      $('#output').append('updating ' + players[row]['unq'] + '[src0]=' + newrk + '<br>');
      players[row]['src0'] = newrk;
      setCookie('Rank'+players[row]['unq'], newrk);
    }
  }
  rerankPlayers();
  displayPlayers($('#sFilterRanks').val());
} //changeUserRank

function filterRanks() {
  var fltr = $('#sFilterRanks').val();
  displayPlayers(fltr);
} //filterRanks

////////////////////////////////////////////////////////////////////////////////////
// Load / Process file
////////////////////////////////////////////////////////////////////////////////////

function prepareDA(f) {
  $('#output').append('prepareDA()<br>');
  $('#dFileIn').hide();
  var tmout = 0;
  
  //load file into array
  fileToArray(f);

  //get positions
  tmout += 500;
  setTimeout(function() {
    getPositions();
  },tmout);
  //get sources
  setTimeout(function() {
    getSources();
  },tmout);

  //array to object
  tmout += 500;
  setTimeout(function() {
    arrayToObject();
  },tmout);

  //inspect arry
  //inspectArray();

  //prepare html tables
  tmout += 500;
  setTimeout(function() {
    prepareTables();
  },tmout);

  //show all the players
  tmout += 500;
  setTimeout(function() {
    displayPlayers("All");
  },tmout);
} //prepareDA

function fileToArray(f) {
  $('#output').append('fileToArray()<br>');
  var files = f.target.files;
  var file = files[0];
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function(event) {
    var csv = event.target.result;
    playerArray = $.csv.toArrays(csv);
  };
  reader.onerror = function() { alert('Unable to read ' + file.fileName); };
  $('#output').append('END fileToArray()<br>');
} //fileToArray

function getPositions() {
  $('#output').append('getPositions()<br>');
  for (var pos in defaultPositionRank) {
    for (var row in playerArray) {
      if (pos == playerArray[row][2]) {
        positions[playerArray[row][2]] = {
          A:0
         ,M:0 
         ,T:0 
         ,Rank:defaultPositionRank[pos]
         ,cnt:0
        };
        break;
      }
    }
  }
  for (var row in playerArray) {
    if ($.isNumeric(playerArray[row][3]) 
        && playerArray[row][3] !== "undefined"
        && !positions[playerArray[row][2]]) {
      if (!defaultPositionRank[playerArray[row][2]]) { nonDefaultPositionCnt++; }
      positions[playerArray[row][2]] = {
        A:0, 
        M:0, 
        T:0, 
        Rank:Object.keys(defaultPositionRank).length+nonDefaultPositionCnt
      };
    }
  }
  for (var p in positions) {
    $('#output').append(p + '|');
  }
  $('#output').append('<br>');
  $('#output').append('END getPositions()<br>');
} //getPositions

function getSources() {
  $('#output').append('getSources()<br>');
  var colcnt = 0;
  sources['0'] = { 
    weight:getCookie('src0')
   ,col:0 
   ,name:'USER'
  };
  for (var col in playerArray[0]) {
    if (colcnt >= 3) {
      sources['' + colcnt] = {
        weight:getCookie('src'+colcnt) || 1
       ,col:colcnt
       ,name:playerArray[0][col]
      };
      setCookie('src'+colcnt+'name', playerArray[0][col])
    }
    colcnt++;
  }
  //sources.shift();
  $('#output').append('END getSources(' + sources.length + ')<br>');
} //getSources

function arrayToObject() {
  $('#output').append('arrayToObject()<br>');
  for (var row in playerArray) {
    if ($.isNumeric(playerArray[row][3]) && playerArray[row][3] !== "undefined") {
      players.push({
        status:getCookie('Status'+playerArray[row][0]+playerArray[row][2]+playerArray[row][1]) || "A"
       ,name:playerArray[row][0]
       ,team:playerArray[row][1]
       ,position:playerArray[row][2]
       ,positionrank:positions[playerArray[row][2]]['Rank']
       ,unq:(playerArray[row][0]+playerArray[row][2]+playerArray[row][1]).replace(/ /g,'').replace(/\./g,'').replace(/,/g,'')
      });
      for (var src in sources) {
        //if ($.isNumeric(playerArray[row][sources[src]['col']])) {
          if (src == '0') {
            players[players.length-1]['src'+src] = getCookie('Rank'+players[players.length-1]['unq']);
          } else {
            players[players.length-1]['src'+src] = playerArray[row][sources[src]['col']];
          }
        //}
      }
    }
  }
  players.shift();
  rerankPlayers();
  $('#output').append('playerArray.length=' + playerArray.length + '<br>');
  $('#output').append('players.length=' + players.length + '<br>');
  $('#fileStats').append('Imported ' + players.length + ' player(s)');
  $('#output').append('END arrayToObject()<br>');
} //arrayToObject

function rerankPlayers() {
  producePositionRank();
  calcAvg();
  sortArray(players, 'calcavg');
  rankPlayers();
} //rerankPlayers

function producePositionRank() {
  $('#output').append('producePositionRank()<br>');
  for (var src in sources) {
    sortArray(players,'src'+src)
    for (var pos in positions) {
      positions[pos]['cnt'] = 0;
    }
    for (var p in players) {
      if ($.isNumeric(players[p]['src'+src])) {
        positions[players[p]['position']]['cnt'] = positions[players[p]['position']]['cnt']+1;
        players[p]['srcposrk'+src] = positions[players[p]['position']]['cnt']
        //if (sources[src]['name'] == "ffc" && players[p]['position'] == 'QB') {
        //  $('#output').append(players[p]['name']+'[srcposrk'+src+']='+players[p]['srcposrk'+src]+'<br>');
        //}
      }
    }    
  }
  $('#output').append('END producePositionRank()<br>');
} //producePositionRank

function calcAvg(p) {
  for (var row in players) {
    p = players[row]
    var srcwt = 0;
    var srcval = 0;
    for (var src in sources) {
      if ($.isNumeric(p['src'+src]) && $.isNumeric(sources[src]['weight'])) {
        srcwt += Math.round(1000*sources[src]['weight'])/1000;
        srcval += (sources[src]['name']=='USER' ? p['src'+src] : p['srcposrk'+src])*sources[src]['weight'];
        //if (p['name'] == 'Andrew Luck') {
        //  $('#output').append('calcAvg::'+sources[src]['name']+'::'+sources[src]['weight']+'::'+p['srcposrk'+src]+'<br>');
        //}
      }
    }
    p['calcavg'] = (srcval/srcwt) || 99999;
    //$('#output').append('calcAvg::'+p['name']+'::'+p['calcavg']+'<br>');
  }
} //calcAvg

function pad(n, width, z) {
  z = z || '0'
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
} //pad

function sortArray(sa, o) {
  //$('#output').append('sortArray('+sources[o.replace('src','')]['name']+','+o+')<br>');
  $('#output').append('sortArray('+o+')<br>');
  sa.sort(function(a,b) {
    return ((pad(Math.round(a[o]*1000),99) < pad(Math.round(b[o]*1000),99)) ? -1 : ((pad(Math.round(a[o]*1000),99) > pad(Math.round(b[o]*1000),99)) ? 1 : 0));
  });
  $('#output').append('END sortArray()<br>');
} //sortArray

function rankPlayers() {
  $('#output').append('rankPlayers()<br>');
  var curcnt = 0;
  for (var pos in positions) {
    positions[pos]['cnt'] = 0;
  }
  for (var p in players) {
    curcnt = positions[players[p]['position']]['cnt']+1;
    positions[players[p]['position']]['cnt'] = curcnt;
    players[p]['rank'] = curcnt;
    players[p]['posrk'] = players[p]['position'] + players[p]['rank'];
    players[p]['orderby'] = ("00"+players[p]['rank']).slice(-3) + ("0"+positions[players[p]['position']]['Rank']).slice(-2);
  }
  $('#output').append('END rankPlayers()<br>');
} //rankPlayers

////////////////////////////////////////////////////////////////////////////////////
// Cookies
////////////////////////////////////////////////////////////////////////////////////

function setCookie(cname, cvalue) {
  localStorage.setItem(cname, cvalue);
} //setCookie

function getCookie(cname) {
  return localStorage.getItem(cname);
} //getCookie
