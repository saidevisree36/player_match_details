const express = require("express");
const path = require("path");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const getPlayerDetails = `SELECT * FROM player_details;`;
  const playerArray = await db.all(getPlayerDetails);
  response.send(
    playerArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT * FROM player_details WHERE player_id=${playerId};`;
  const player = await db.get(getPlayerDetails);
  response.send(convertDbObjectToResponseObject(player));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const getPlayerQuery = `
  UPDATE player_details
  SET
   player_name='${playerName}'
   WHERE player_id=${playerId};`;
  await db.run(getPlayerQuery);
  response.send("Player Details Updated");
});
const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetails = `SELECT * FROM match_details
  WHERE match_id=${matchId};`;
  const matchArray = await db.get(getPlayerDetails);
  response.send(convertDbObjectToResponseObject1(matchArray));
});
//get all player matches
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllPlayerDetails = `
  SELECT * FROM player_match_score NATURAL JOIN  match_details
  WHERE player_id=${playerId};`;
  const playerDetail = await db.all(getAllPlayerDetails);
  response.send(
    playerDetail.map((eachState) => convertDbObjectToResponseObject1(eachState))
  );
});
// list of players of a specified match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllMatchDetails = `
     SELECT * FROM player_match_score NATURAL JOIN  player_details
     WHERE match_id=${matchId};`;
  const playerDetail = await db.all(getAllMatchDetails);
  response.send(
    playerDetail.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});
// get all player scores
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatePlayerScoresDetails = `
    SELECT 
    player_details.player_id As playerId,
    player_details.player_name As playerName,
    SUM(player_match_score.score) As totalScore,
    SUM(fours) As totalFours,
    SUM(sixes) As totalSixes 
    FROM player_details INNER JOIN player_match_score ON
    player_details.player_id=player_match_score.player_id
    WHERE player_details.player_id=${playerId};`;
  const playerScores = await db.get(getStatePlayerScoresDetails);
  response.send(playerScores);
});
module.exports = app;
