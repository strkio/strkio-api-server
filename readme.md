# strkio-api-server

[strk.io](http://strk.io/) HTTP API. At this point it's primary goal is to
provide an easy way to integrate external tools (like [hubot-strkio](https://github.com/strkio/hubot-strkio)).
[strk.io](http://strk.io/) does NOT depend on it.

## Usage

```sh
curl -X GET http://api.strk.io/v1/gists/:gist_id/streaks/:streak_name \
  -H 'Authorization: token OAUTH_TOKEN'

curl -X PATCH http://api.strk.io/v1/gists/:gist_id/streaks/:streak_name \
  -H 'Authorization: token OAUTH_TOKEN' -H 'Content-Type: application/json' \
  -d '{"data": {":date": "[+-]?\d+", ...}}'
```

Examples:

```sh
# increase "2014-11-23" counter by 1
curl -X PATCH http://api.strk.io/v1/gists/244918924dcc433e9283/streaks/1 \
  -H 'Authorization: token 9a72001dc9dc92bb08ea3ab424fd8e1500ef3057' -H 'Content-Type: application/json' \
  -d '{"data": {"2014-11-23": "+1"}}' \
    -w "\n" -i
```

## Running locally

Make sure you have [Node.js](http://nodejs.org/) >= 0.10.

```sh
$ git clone https://github.com/strkio/strkio-api-server # or clone your own fork
$ cd strkio-api-server
$ npm install
$ npm start # or `npm run start-dev` for development mode
```

`strkio-api` should now be running on [localhost:3000](http://localhost:3000/).

## Deploying to Heroku

### Heroku Button

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

### Manually
 
> [Heroku Toolbelt](https://toolbelt.heroku.com/) must be installed.

```sh
$ heroku create
$ git push heroku master
```

## Deploying to Azure

### Azure Button

[![Deploy to Azure](http://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/)

### Manually

> [azure-cli](https://www.npmjs.com/package/azure-cli) must be installed.

```sh
$ azure site create SITE_NAME --git
$ git push azure master
```

## License

[MIT License](http://opensource.org/licenses/mit-license.php).
