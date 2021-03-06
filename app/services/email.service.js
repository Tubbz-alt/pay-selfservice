'use strict'

const logger = require('../utils/logger')(__filename)
const ConnectorClient = require('./clients/connector.client.js').ConnectorClient

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

const getEmailSettings = async function (accountID, correlationId) {
  try {
    const data = await connectorClient.getAccount({
      gatewayAccountId: accountID,
      correlationId: correlationId
    })
    return {
      customEmailText: data.email_notifications.PAYMENT_CONFIRMED.template_body,
      emailEnabled: data.email_notifications.PAYMENT_CONFIRMED.enabled,
      emailCollectionMode: data.email_collection_mode,
      refundEmailEnabled: data.email_notifications.REFUND_ISSUED && data.email_notifications.REFUND_ISSUED.enabled
    }
  } catch (err) {
    clientFailure(err, 'GET', false)
  }
}

const updateConfirmationTemplate = async function (accountID, emailText, correlationId) {
  try {
    const patch = { 'op': 'replace', 'path': '/payment_confirmed/template_body', 'value': emailText }

    await connectorClient.updateConfirmationEmail({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })
  } catch (err) {
    clientFailure(err, 'PATCH', true)
  }
}

const setEmailCollectionMode = async function (accountID, collectionMode, correlationId) {
  try {
    const patch = { 'op': 'replace', 'path': 'email_collection_mode', 'value': collectionMode }
    await connectorClient.updateEmailCollectionMode({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })
  } catch (err) {
    clientFailure(err, 'PATCH', false)
  }
}

const setConfirmationEnabled = async function (accountID, enabled, correlationId) {
  const patch = { 'op': 'replace', 'path': '/payment_confirmed/enabled', 'value': enabled }

  try {
    await connectorClient.updateConfirmationEmailEnabled({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })
  } catch (err) {
    clientFailure(err, 'PATCH', true)
  }
}

const setRefundEmailEnabled = async function (accountID, enabled, correlationId) {
  try {
    const patch = { 'op': 'replace', 'path': '/refund_issued/enabled', 'value': enabled }
    await connectorClient.updateRefundEmailEnabled({
      payload: patch,
      correlationId: correlationId,
      gatewayAccountId: accountID
    })
  } catch (err) {
    clientFailure(err, 'PATCH', true)
  }
}

const clientFailure = function (err, methodType, isPatchEndpoint) {
  const errMsg = isPatchEndpoint
    ? `Calling connector to update email notifications for an account threw exception`
    : `Calling connector to get/patch account data threw exception`
  logger.error(errMsg, {
    service: 'connector',
    method: methodType,
    error: err
  })
  throw new Error(errMsg)
}

module.exports = {
  getEmailSettings,
  updateConfirmationTemplate,
  setEmailCollectionMode,
  setConfirmationEnabled,
  setRefundEmailEnabled
}
