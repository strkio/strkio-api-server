require('es6-shim');

var restify = require('restify');
var GitHubGist = require('strkio-storage-githubgist');
var bunyan = require('bunyan');

var server = restify.createServer({name: 'strkio-api'});

server.use(restify.queryParser());
server.use(restify.jsonBodyParser());

if (process.env.NODE_ENV === 'development') {
  server.on('after', restify.auditLogger({
    log: bunyan.createLogger({name: 'audit', stream: process.stdout})
  }));
}

server.use(function (req, res, next) {
  var authorization = req.header('authorization');
  if (authorization && ~authorization.toLowerCase().indexOf('token ')) {
    req.accessToken = authorization.substr(6);
  }
  next();
});

function requireAccessToken (req, res, next) {
  if (!req.accessToken) {
    return next(new restify.UnauthorizedError());
  }
  next();
}

function notImplemented(req, res, next) {
  next(new restify.NotImplementedError());
}

server.post('/v1/gists', notImplemented);

server.post('/v1/gists/:gist_id/streaks', notImplemented);

server.get('/v1/gists/:gist_id', notImplemented);

function findStreak(gist, streakName, cb) {
  var streaks = gist.data.streaks;
  var index = streaks.findIndex(function (streak) {
    return streak.name === streakName;
  });
  if (~index) {
    cb(null, streaks[index], index);
  } else {
    var validStreakNames = streaks.map(function (streak) {
      return streak.name;
    });
    cb(new restify.NotFoundError(
      'GitHub Gist ' + gist.data.id + ' does not contain streak ' +
      '\'' + streakName + '\' ' +
      '(available: ' + validStreakNames + ')'));
  }
}

server.get('/v1/gists/:gist_id/streaks/:streak_name',
  function respond(req, res, next) {
    var gistId = req.params['gist_id'];
    var streakName = req.params['streak_name'];
    new GitHubGist({id: gistId}, {oauthToken: req.accessToken})
      .fetch(function (err, gist) {
        if (err) {
          return next(err);
        }
        findStreak(gist, streakName, function (err, streak) {
          if (err) {
            return next(err);
          }
          res.json(200, streak);
        });
      });
  });

function asTimestamp(date) {
  return typeof date === 'string' ? Date.parse(date) :
    (typeof date === 'number' ? date : NaN);
}

function parseDataChanges(data) {
  var result = [];
  var keys = Object.keys(data);
  for (var i = 0, end = keys.length, key, timestamp, value; i < end; i++) {
    key = keys[i];
    timestamp = asTimestamp(key);
    value = '' + data[key];
    if (!timestamp || !/[+-]?\d+/.test(value)) {
      throw new restify.BadRequestError();
    }
    result.push({
      key: new Date(timestamp).toISOString().substr(0, 10),
      value: value
    });
  }
  return result;
}

function applyDataChanges(data, changes) {
  changes.forEach(function (change) {
    var key = change.key;
    data[key] || (data[key] = 0);
    var prefix = change.value.charAt(0);
    if (prefix === '+') {
      data[key] += parseInt(change.value.substr(1), 10);
    } else
    if (prefix === '-') {
      data[key] -= parseInt(change.value.substr(1), 10);
    } else {
      data[key] = parseInt(change.value, 10);
    }
  });
}

server.patch('/v1/gists/:gist_id/streaks/:streak_name',
  requireAccessToken,
  function respond(req, res, next) {
    if (!req.accessToken) {
      return next(new restify.UnauthorizedError());
    }
    var gistId = req.params['gist_id'];
    var streakName = req.params['streak_name'];
    new GitHubGist({id: gistId}, {oauthToken: req.accessToken})
      .fetch(function (err, gist) {
        if (err) {
          return next(err);
        }
        findStreak(gist, streakName, function (err, streak) {
          if (err) {
            return next(err);
          }
          var body = req.body;
          Object.keys(body)
            .filter(function (key) {
              return key !== 'data';
            })
            .forEach(function (key) {
              streak[key] = body[key];
            });
          if (body.data) {
            var changes;
            try {
              changes = parseDataChanges(body.data);
            } catch (e) {
              return next(e);
            }
            streak.data || (streak.data = {});
            applyDataChanges(streak.data, changes);
          }
          gist.save(function (err) {
            if (err) {
              return next(err);
            }
            res.send(200);
          });
        });
      });
  });

server.del('/v1/gists/:gist_id', notImplemented);

server.del('/v1/gists/:gist_id/streaks/:streak_name', notImplemented);

server.listen(process.env.PORT || 3000, function () {
  console.log('%s listening at %s', server.name, server.url);
});
