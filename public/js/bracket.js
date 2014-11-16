$(document).ready(function() {  
Parse.initialize("WSUgho0OtfVW9qimoeBAKW8qHKLAIs3SQqMs0HW6", "9ZmxN9S1vOOfTaL7lD5vtUYRAwTEComMztpJVuTK");
  
  var bid = getUrlParameter("bid");
  var creator = getUrlParameter("creator");

  //query the team objects
  var bracket = Parse.Object.extend("Brackets");
  var query = new Parse.Query(bracket);
  query.get(bid,{
    success: function(object) {
      var bracketData = object.get('bracket_data');
      var furthest_round = object.get('furthest_round');
      var totalRounds = object.get("total_rounds");
      $("#title").append(object.get('category'));
      //if all players have included some kind of input, build bracket
      //else, alert the user that other players still need to input
      if (object.get('player_inputs').length >= object.get('playerCount')){
        console.log(object.get('player_inputs').length);
        console.log(object.get('playerCount'));
        buildBracket(bracketData,totalRounds); 

        var refreshIntervalId;     
        refreshIntervalId = setInterval(function(){
           var bracket1 = Parse.Object.extend("Brackets");
           var query1 = new Parse.Query(bracket);
           query1.get(bid, {
           success: function(object) {
            var votedPlayers = object.get('votedPlayers');
            var current_round = object.get('furthest_round');
            var currentVoted = votedPlayers['round'+current_round];    
             if(furthest_round != current_round){
                 window.location.href=window.location.href;
                
             }
             if(currentVoted >= object.get('playerCount')){
                  autoMoveToNext();
                  clearInterval(refreshIntervalId);
             }
          },
          error: function(object, error) {
             
          }
         });          
        }, 1000);

      }
      else {
        var player = object.get('playerCount') - object.get('player_inputs').length;
        $("#playerCount").html("Building bracket, waiting for " + player + " people");
        setInterval(function(){
           var player = object.get('playerCount') - object.get('player_inputs').length;
           $("#playerCount").html("Building bracket, waiting for " + player + " people");
           window.location.href=window.location.href;
          
        }, 3000);
       
        //alert("Waiting on other players to join...");
      } 
      if(creator==="yes" && bracketData!=undefined && furthest_round!=totalRounds){
        $("#buttonLocation").append("<button id='endRoundButton' class='btn btn-primary'>Move to next round</button>");
        $("#endRoundButton").on("click", function(){

          //determine the winner by comparing votes and incrementing the round
          //query the team objects
          var bracket = Parse.Object.extend("Brackets");
          var query = new Parse.Query(bracket);
          query.get(bid,{
            success: function(object) {
              var bracketData = object.get('bracket_data');
              var currentRound = object.get('furthest_round');
              var totalRounds = object.get("total_rounds");
              var results = moveToNextRound(bracketData,totalRounds,currentRound); 
              object.set("bracket_data", results);
              object.set("furthest_round", currentRound+1);
              object.save(null, {
              success: function(savedObject) {
                // Execute any logic that should take place after the object is saved.
                console.log(JSON.stringify(savedObject));
                if (creator==="yes"){
                  window.location.href = "./bracket.html?bid="+ bid + "&creator=yes";
                }
                else {
                  window.location.href = "./bracket.html?bid="+ bid;
                }
              },
              error: function(savedObject, error) {
                alert('Failed to create new object, with error code: ' + error.message);
              }
              });
            },
            error: function(error) {
              alert("Error: " + error.code + " " + error.message);
            }
          });
        });
      }
    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });

  //display countdown timer for voting
  $(function(){ 
    var currTime = new Date();
    var endTime = new Date();
    endTime.setMinutes(currTime.getMinutes()+2);
    $('#timer').countdown({
      until: endTime,
      format: "MS",
      compact: true,
      onExpiry: autoMoveToNext
    });
  });


  $(function(){

     var bracket = Parse.Object.extend("Brackets");
     var query = new Parse.Query(bracket);
     query.get(bid, {
     success: function(object) {
      var current_round = object.get('furthest_round');
      if(current_round >= object.get('total_rounds')){
        console.log("%%%%%%%%");
        $("#timer").css('visibility', 'hidden');
      }        
      
    },
    error: function(object, error) {
       
    }
   });          

  });




  //NOTES
  //name = string value given in bracket
  //id = allows for unique hovering
  //seed = number shown before value

  var bracketData = []; 
  function buildBracket(data,rounds)
  {
      console.log (JSON.stringify(data));
      var bracketData= []; //store the entire data for bracket
      var roundArray = []; //store each round's teams
      var pairArray = [];  //store an array of team pairs
      var teamObj = {};
      var team_list = []; 
      var pairCount = 0; 
      for (var i = 1; i <=rounds; i++) {
        //build the team_list for the round we are in 
        for(var j = 0; j < data.length; j++){
          //only add the team to the array if it is >= the current round
          if (data[j].round >= i){
            team_list.push(data[j].value);
            console.log(JSON.stringify(data[j].value));
          }
        }

        //calculate how many pairs there should be for each round, except winner
        var pairNumber = Math.ceil((Math.pow(2,(rounds - i)))/2); 
        console.log(pairNumber);

        //if the team list length isnt 0, then we have all the necessary teams
        if(team_list.length!=0) {
          if(rounds!=i)//check if any round other than last
          {
            //now add the teams to the bracketData
            for (var k = 0; k < team_list.length; k++){
              teamObj['name'] = team_list[k];
              teamObj['id'] = k;
              pairArray.push(teamObj);
              teamObj = {};
              pairCount++; 
              if(pairCount==2) {
                //add the pair to the array for the current round
                roundArray.push(pairArray);
                pairCount = 0; 
                pairArray =  [];
              }
            }
          }
          else //last round scenario
          {
            teamObj['name'] = team_list[0];
            teamObj['id'] = 0;
            var winnerArray = []
            winnerArray.push(teamObj);
            roundArray.push(winnerArray);
          }
          //push the round array to the bracketData
          bracketData.push(roundArray);
          roundArray = [];
        }
        else if (rounds!=i){
          for (var k = 0; k < pairNumber; k++)
          {
            teamObj['name'] = "To Be Determined";
            teamObj['id'] = "tbd";
            pairArray.push(teamObj);
            pairArray.push(teamObj);
            teamObj = {};
            //add the pair to the array for the current round
            roundArray.push(pairArray);
            pairArray =  [];
          }
          //push the round array to the bracketData
          bracketData.push(roundArray);
          roundArray = [];
        }
        else {
          teamObj['name'] = "To Be Determined";
          teamObj['id'] = "tbd";
          var winnerArray = [];
          winnerArray.push(teamObj);
          teamObj={};
          //add the pair to the array for the current round
          roundArray.push(winnerArray);
          bracketData.push(roundArray);
          roundArray=[];
        }
        team_list=[];
      }

      //build the bracket with the data
      $(".my_gracket").gracket({
        src : bracketData
      });
      console.log(JSON.stringify(bracketData));
  }

  //function to increment the round based on vote
  function moveToNextRound(data,totalRounds,currentRound) {
    console.log("currentRound");
    console.log(currentRound);
    var pairCount = 0;
    for (var i = 0; i<data.length; i++) {
      var team1_index; 
      var team2_index; 
      console.log("objectRound")
      console.log(data[i]["round"]);
      if (data[i]["round"] == currentRound) {
        console.log("equal");
        if(pairCount==0){
          console.log("pairCount==0");
          team1_index = i; 
          pairCount++;
        }
        else if (pairCount ==1){
          team2_index = i; 
          if (data[team1_index]["votes" + currentRound]>data[team2_index]["votes" + currentRound]){
            data[team1_index]["round"]++;
            console.log(JSON.stringify(data[team1_index]["value"]));
            console.log(JSON.stringify(data[team1_index]["round"]));
          }
          else if(data[team1_index]["votes" + currentRound]==data[team2_index]["votes" + currentRound]){
            var randNum = Math.round(Math.random());
            if(randNum == 1){
              data[team1_index]["round"]++;
            }
            else {
              data[team2_index]["round"]++;
            }
          }
          else{
            data[team2_index]["round"]++;
            console.log(JSON.stringify(data[team2_index]["value"]));
            console.log(JSON.stringify(data[team2_index]["round"]));
          }
          pairCount=0;
        }
      }
    }
    return data;
  }

  function getUrlParameter(sParam)
  {
      var sPageURL = window.location.search.substring(1);
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++) 
      {
          var sParameterName = sURLVariables[i].split('=');
          if (sParameterName[0] == sParam) 
          {
              return sParameterName[1];
          }
      }
  }

  function autoMoveToNext(){
          var bracket = Parse.Object.extend("Brackets");
          var query = new Parse.Query(bracket);
          query.get(bid,{
            success: function(object) {
              var bracketData = object.get('bracket_data');
              var currentRound = object.get('furthest_round');

              var totalRounds = object.get("total_rounds");
              var results = moveToNextRound(bracketData,totalRounds,currentRound); 
              object.set("bracket_data", results);
              object.set("furthest_round", currentRound+1);
     
              object.save(null, {
              success: function(savedObject) {
                // Execute any logic that should take place after the object is saved.
                window.location.href=window.location.href;
              },
              error: function(savedObject, error) {
                alert('Failed to create new object, with error code: ' + error.message);
              }
              });
            },
            error: function(error) {
              alert("Error: " + error.code + " " + error.message);
            }
          });
  }

  $(document).on( "click", ".g_team", function() {
    if (creator==="yes"){
      window.location.href = "./vote.html?bid="+ bid + "&creator=yes";
    }
    else {
      window.location.href = "./vote.html?bid="+ bid;
    }
  });
  // var bracketData = 
  // [
  //   [
  //     [{"name":"pizza","id":0},{"name":"burritos","id":1}],
  //     [{"name":"Chinese","id":2},{"name":"sushi","id":3}],
  //     [{"name":"Korean","id":4},{"name":"burgers","id":5}],
  //     [{"name":"pasta","id":6},{"name":"vegetarian","id":7}]
  //   ],
  //   [
  //     [{"name":"To Be Determined","id":"tbd"},{"name":"To Be Determined","id":"tbd"}],
  //     [{"name":"To Be Determined","id":"tbd"},{"name":"To Be Determined","id":"tbd"}]
  //   ],
  //   [
  //     [{"name":"To Be Determined","id":"tbd"},{"name":"To Be Determined","id":"tbd"}]
  //   ],
  //   [
  //     [{"name":"To Be Determined","id":"tbd"}]
  //   ]
  // ];


});























