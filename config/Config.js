var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : 'ReyBan'
});
 
connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
 
module.exports = connection;

