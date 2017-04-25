'use strict';
var express = require('express');
var _ = require('lodash');
var sinon = require('sinon');
var userFixture = require('../fixtures/user_fixtures');
var getUser = (opts) => {
    return userFixture.validUser(opts).getAsObject();
  },

  createAppWithSession = function (app, sessionData, gatewayAccountData, serviceData) {
    var proxyApp = express();
    proxyApp.all("*", function (req, res, next) {
      sessionData.destroy = sinon.stub();
      req.session = sessionData || {};
      req.gateway_account = gatewayAccountData || {};
      req.service_ids = serviceData.service_ids || {};
      req.currentServiceName = serviceData.currentServiceName || '';
      console.log('>>>>>> ' + req.toString());
      next();
    });
    proxyApp.use(app);
    return proxyApp;
  },

  getAppWithLoggedInUser = function (app, user) {
    var validSession = getMockSession(user);
    return createAppWithSession(app, validSession);
  },

  getAppWithSessionAndGatewayAccountCookies = function (app, sessionData, gatewayAccountData) {
    return createAppWithSession(app, sessionData, gatewayAccountData);
  },

  getAppWithSessionWithoutSecondFactor = function (app, user) {
    var session = getMockSession(user);
    delete session.secondFactor;

    return createAppWithSession(app, session);
  },

  getAppWithSessionAndService = function(app, session, gatewayAccountData, serviceData){
    return createAppWithSession(app, session, gatewayAccountData, serviceData);
  },

  getMockSession = function (user) {
    return _.cloneDeep({
      csrfSecret: "123",
      12345: {refunded_amount: 5},
      passport: {
        user: user,
      },
      secondFactor: 'totp',
      last_url:'last_url',
      version: user.sessionVersion
    });
  };

module.exports = {
  getAppWithLoggedInUser: getAppWithLoggedInUser,
  getAppWithSessionAndGatewayAccountCookies: getAppWithSessionAndGatewayAccountCookies,
  getMockSession: getMockSession,
  getUser: getUser,
  getAppWithSessionWithoutSecondFactor: getAppWithSessionWithoutSecondFactor,
  getAppWithSessionAndService: getAppWithSessionAndService
};
