var logger = require('winston');
var clientSessions = require("client-sessions");
var Auth0Strategy = require('passport-auth0');
var passport = require('passport');
var util = require('util');

var AUTH_STRATEGY_NAME = 'auth0';
var AUTH_STRATEGY = new Auth0Strategy({
    domain:       process.env.AUTH0_URL,
    clientID:     process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:  '/selfservice/callback'
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    logger.info('Logged in: ' + profile.displayName);
    return done(null, profile);
  }
);

var auth = module.exports = {

    enforce: function (req, res, next) {
        if (req.session.passport && req.session.passport.user) {
            next();
        } else {
            req.session.last_url = req.originalUrl;
            res.redirect('/selfservice/login');
        }
    },

    login: passport.authenticate(AUTH_STRATEGY_NAME, { session: true }),

    callback: function (req, res, next) {
      var authen_func = passport.authenticate(
          'auth0',
          {
            failureRedirect: '/selfservice/login',
            successRedirect: req.session.last_url
          }
      );
      req.session.last_url = undefined;
      return authen_func(req, res, next);
    },

    bind: function (app, override_strategy) {
        var strategy = override_strategy || AUTH_STRATEGY;
        passport.use(strategy);
        passport.serializeUser(function(user, done) {
          done(null, user);
        });
        passport.deserializeUser(function(user, done) {
          done(null, user);
        });
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(clientSessions({
            cookieName: 'session',
            secret: process.env.SESSION_ENCRYPTION_KEY
        }));
    }
};
