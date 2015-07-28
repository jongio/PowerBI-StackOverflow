/*
Environment Variables:
{
  "api_version":{
    "default":"2.2",
    "desc":"The StackOverflow API version to use"
  },
  "site":{
    "default":"stackoverflow",
    "desc":"The StackExchange site to filter"
  },
  "filter":{
    "default":"!9YdnSIN1B",
    "desc":"Passed to StackOverflow API to add answer data. You can create your own filter here: http://api.stackexchange.com/docs/create-filter"
  },
  "page_size":{
    "default":25,
    "desc":"The number of items to request with each StackOverflow API call"
  },
  "tag":{
    "default":"",
    "desc":"The tag to filter StackOverflow questions"
  },
  "key":{
    "default":"",
    "desc":"Your StackOverflow app key. Create one here: http://stackapps.com/apps/oauth/register/submit "
  },
  "encrypt":{
    "default":true,
    "desc":"Encrypt SQL requests or not. Maps to mssql.options.encrypt"
  },
  "user":{
    "default":"",
    "desc":"SQL user"
  },
  "password":{
    "default":"",
    "desc":"SQL password"
  },
  "server":{
    "default":"",
    "desc":"SQL server name"
  },
  "database":{
    "default":"",
    "desc":"SQL database name"
  }
}
*/
var sql = require('mssql')
var request = require('request')
var util = require('util')
var moment = require('moment')

require('dotenv').load({silent: true})

var api_version = process.env.api_version || '2.2'
var site = process.env.site || 'stackoverflow'
var filter = process.env.filter || '!9YdnSIN1B'
var page_size = process.env.page_size || 25
var encrypt = process.env.encrypt || true

var config = {
  user: process.env.user,
  password: process.env.password,
  server: process.env.server,
  database: process.env.database,
  options: {
    encrypt: encrypt
  }
}

var get = function (page, callback) {

  var uri = util.format(
    'https://api.stackexchange.com/%s/questions?page=%s&pagesize=%s&tagged=%s&site=%s&filter=%s&key=%s',
    api_version,
    page,
    page_size,
    process.env.tag,
    site,
    filter,
    process.env.key
  )

  console.log('Getting page %s', page, uri)

  request({url: uri, gzip: true, json: true}, function (err, res, body) {

    if (err || res.statusCode !== 200) {
      if (err) console.log('ERROR:', err)
      if (res) console.log(res.statusCode, res.statusMessage)
      if (body) console.log(body)
      throw err
    }

    if (body.items && body.items.length > 0) {
      callback(body.items)
    }

    if (body.has_more) {
      // Using setTimeout here so we don't trigger the SOF throttling limits. Anything more than 30 requests per second will get you banned for at least a day. More info: https://api.stackexchange.com/docs/throttle
      setTimeout(get(++page, callback), 250)
    }
  })
}

var upsert = function (items) {
  if (!items || items.length === 0) {
    return
  }

  var connection = new sql.Connection(config, function (err) {
    if (err) {
      console.log('ERROR:', err)
      throw err
    }

    items.forEach(function (item) {
      console.log('Upserting question_id: %s, title: %s', item.question_id, item.title)
      var request = new sql.Request(connection)
      request.input('question_id', sql.Int, item.question_id)
      request.input('link', sql.NVarChar, item.link)
      request.input('title', sql.NVarChar, item.title)
      request.input('creation_date', sql.DateTime, moment.unix(item.creation_date).toDate())
      request.input('last_activity_date', sql.DateTime, moment.unix(item.last_activity_date).toDate())
      if (item.answers) {
        request.input('first_answer_creation_date', sql.DateTime, moment.unix(item.answers[0].creation_date).toDate())
      }
      request.input('score', sql.Int, item.score)
      request.input('answer_count', sql.Int, item.answer_count)
      request.input('view_count', sql.Int, item.view_count)
      request.input('is_answered', sql.Bit, item.is_answered)

      request.execute('questions_upsert', function (err, recordsets, returnValue) {
        if (err || returnValue !== 0) {
          console.log('ERROR: upsert error for question_id: ' + item.question_id)
          throw err
        }
      })
    })

    connection.close()
  })
}

get(1, upsert)
