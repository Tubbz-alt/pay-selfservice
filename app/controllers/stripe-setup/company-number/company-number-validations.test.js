'use strict'

const companyNumberValidations = require('./company-number-validations')

// Constants
const validCompanyNumber = '01234567'
const invalidCompanyNumber = '¯\\_(ツ)_/¯'

describe('company number validations', () => {
  it('should validate successfully', () => {
    expect(companyNumberValidations.validateCompanyNumber(validCompanyNumber).valid).toBe(true) // eslint-disable-line
  })

  it('should not be valid when blank', () => {
    expect(companyNumberValidations.validateCompanyNumber('')).toEqual({
      valid: false,
      message: 'This field cannot be blank'
    })
  })

  it('should not be valid when company number is invalid', () => {
    expect(companyNumberValidations.validateCompanyNumber(invalidCompanyNumber)).toEqual({
      valid: false,
      message: 'Enter a valid company number'
    })
  })
})
