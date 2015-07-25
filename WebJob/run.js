var env = require('node-env-file');
var sql = require('mssql');
var request = require('request');
var util = require('util');
var url = require('url');
var moment = require('moment');

env(__dirname + '/.env');

var config = {
  user: process.env.user,
  password: process.env.password,
  server: process.env.server,
  database: process.env.database,
  options:{
    encrypt: true
  }
};

var get = function(page, callback){

  var uri = util.format(
    'https://api.stackexchange.com/%s/questions?page=%s&pagesize=%s&tagged=%s&site=%s&filter=%s',
    process.env.api_version,
    page,
    process.env.page_size,
    process.env.tag,
    process.env.site,
    process.env.filter
  );

  console.log('Getting page %s', page, uri);

  request({url: uri, gzip: true, json:true}, function(err, res, body){

    if(err || res.StatusCode !== 200){
      if(err) console.log(err);
      if(res) console.log(res.statusMessage);
      if(body) console.log(body);
      return
    }

    if(body.items && body.items.length > 0)
      callback(body.items);

    if(body.has_more){
      // Using setTimeout here so we don't trigger the SOF throttling limits. Anything more than 30 requests per second will get you banned for at least a day
      setTimeout(get(++page, callback), 250);
    }
  });
};

var upsert = function(items){
  if(!items || items.length === 0)
    return;

  var connection = new sql.Connection(config, function(err){
    if(err){
      console.log(err);
      return;
    }

    items.forEach(function(item){
      var request = new sql.Request(connection);
      request.input('question_id', sql.Int, item.question_id);
      request.input('link', sql.NVarChar, item.link);
      request.input('title', sql.NVarChar, item.title);
      request.input('creation_date', sql.DateTime, moment.unix(item.creation_date).toDate());
      request.input('last_activity_date', sql.DateTime, moment.unix(item.last_activity_date).toDate());
      if(item.answers){
        request.input('first_answer_creation_date', sql.DateTime, moment.unix(item.answers[0].creation_date).toDate());
      }
      request.input('score', sql.Int, item.score);
      request.input('answer_count', sql.Int, item.answer_count);
      request.input('view_count', sql.Int, item.view_count);
      request.input('is_answered', sql.Bit, item.is_answered);

      request.execute('questions_upsert', function(err, recordsets, returnValue){
        if(err){
          console.log(err);
          return;
        }

        if(returnValue !== 0){
          console.log('upsert error for question_id: ' + item.question_id);
          return;
        }
      });
    });

    connection.close();
  });
};

get(1, upsert);
