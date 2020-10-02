'use strict'

const moment = require('moment-timezone')

const validations = require('./server-side-form-validations')

const BLANK_TEXT = ''
const MAX_LENGTH = 25
const LOOOONG_TEXT = 'abcdefghijklmnopqrstuvwxyz'

describe('Server side form validations', () => {
  describe('optional text field validations', () => {
    it('should validate that optional text is valid', () => {
      expect(validations.validateOptionalField('some text', MAX_LENGTH).valid).toBe(true) // eslint-disable-line
    })

    it('should validate that blank text is valid', () => {
      expect(validations.validateOptionalField(BLANK_TEXT).valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid when optional text is too long', () => {
      expect(validations.validateOptionalField(LOOOONG_TEXT, MAX_LENGTH)).toEqual({
        valid: false,
        message: 'The text is too long'
      })
    })
  })

  describe('mandatory text field validations', () => {
    it('should validate that mandatory text is valid', () => {
      expect(validations.validateMandatoryField('some text', MAX_LENGTH).valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid when mandatory text is blank', () => {
      expect(validations.validateMandatoryField(BLANK_TEXT, MAX_LENGTH)).toEqual({
        valid: false,
        message: 'This field cannot be blank'
      })
    })

    it('should not be valid when mandatory text is too long', () => {
      expect(validations.validateMandatoryField(LOOOONG_TEXT, MAX_LENGTH)).toEqual({
        valid: false,
        message: 'The text is too long'
      })
    })
  })

  describe('postcode validations', () => {
    it('should be valid when UK postcode', () => {
      expect(validations.validatePostcode('NW1 5GH').valid).toBe(true) // eslint-disable-line
    })

    it('should be valid when UK postcode but all lower-case', () => {
      expect(validations.validatePostcode('nw1 5gh').valid).toBe(true) // eslint-disable-line
    })

    it('should be valid when UK postcode but no space', () => {
      expect(validations.validatePostcode('NW15GH').valid).toBe(true) // eslint-disable-line
    })

    it(
      'should be valid when UK postcode but no space and all lower-case',
      () => {
        expect(validations.validatePostcode('nw15gh').valid).toBe(true) // eslint-disable-line
      }
    )

    it('should not be valid when postcode is blank', () => {
      expect(validations.validatePostcode(BLANK_TEXT)).toEqual({
        valid: false,
        message: 'Enter a postcode'
      })
    })

    it(
      'should not be valid when postcode is UK postcode with extra punctuation',
      () => {
        expect(validations.validatePostcode('NW1! 5GH')).toEqual({
          valid: false,
          message: 'Please enter a real postcode'
        })
      }
    )

    it(
      'should not be valid when postcode is not UK postcode and country not provided',
      () => {
        expect(validations.validatePostcode('CA90210')).toEqual({
          valid: false,
          message: 'Please enter a real postcode'
        })
      }
    )

    it(
      'should not be valid when postcode is not UK postcode and country is GB',
      () => {
        expect(validations.validatePostcode('CA90210', 'GB')).toEqual({
          valid: false,
          message: 'Please enter a real postcode'
        })
      }
    )

    it(
      'should be a valid postcode when postcode is not UK postcode and country is not GB',
      () => {
        expect(validations.validatePostcode('CA90210', 'IE').valid).toBe(true) // eslint-disable-line
      }
    )
  })

  describe('date of birth validations', () => {
    it('should be valid when date of birth in the past', () => {
      expect(validations.validateDateOfBirth('10', '6', '2000').valid).toBe(true) // eslint-disable-line
    })

    it('should be valid when day has leading zero', () => {
      expect(validations.validateDateOfBirth('01', '6', '2000').valid).toBe(true) // eslint-disable-line
    })

    it('should be valid when month has leading zero', () => {
      expect(validations.validateDateOfBirth('10', '06', '2000').valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid nothing entered', () => {
      expect(validations.validateDateOfBirth('', '', '')).toEqual({
        valid: false,
        message: 'Enter the date of birth'
      })
    })

    it('should not be valid when no day entered', () => {
      expect(validations.validateDateOfBirth('', '6', '2000')).toEqual({
        valid: false,
        message: 'Date of birth must include a day'
      })
    })

    it('should not be valid when no month entered', () => {
      expect(validations.validateDateOfBirth('10', '', '2000')).toEqual({
        valid: false,
        message: 'Date of birth must include a month'
      })
    })

    it('should not be valid when no year entered', () => {
      expect(validations.validateDateOfBirth('10', '6', '')).toEqual({
        valid: false,
        message: 'Date of birth must include a year'
      })
    })

    it('should not be valid when no day and month entered', () => {
      expect(validations.validateDateOfBirth('', '', '2000')).toEqual({
        valid: false,
        message: 'Date of birth must include a day and month'
      })
    })

    it('should not be valid when no day and year entered', () => {
      expect(validations.validateDateOfBirth('', '6', '')).toEqual({
        valid: false,
        message: 'Date of birth must include a day and year'
      })
    })

    it('should not be valid when no month and year entered', () => {
      expect(validations.validateDateOfBirth('10', '', '')).toEqual({
        valid: false,
        message: 'Date of birth must include a month and year'
      })
    })

    it('should not be valid when day does not contain numbers', () => {
      expect(validations.validateDateOfBirth('cakeday', '6', '2000')).toEqual({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when month does not contain numbers', () => {
      expect(validations.validateDateOfBirth('10', 'Prairial', '2000')).toEqual({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when year does not contain numbers', () => {
      expect(validations.validateDateOfBirth('10', '6', 'dragon')).toEqual({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when year does not have four digits', () => {
      expect(validations.validateDateOfBirth('10', '6', '00')).toEqual({
        valid: false,
        message: 'Year must have 4 numbers'
      })
    })

    it('should not be valid when day is a negative number', () => {
      expect(validations.validateDateOfBirth('-10', '6', '2000')).toEqual({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when date does not exist', () => {
      expect(validations.validateDateOfBirth('29', '02', '1999')).toEqual({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when date is in the future', () => {
      const dateInTheMysteriousFuture = moment().add(1, 'days')

      expect(validations.validateDateOfBirth(dateInTheMysteriousFuture.date(),
        dateInTheMysteriousFuture.month() + 1, dateInTheMysteriousFuture.year())).toEqual({
        valid: false,
        message: 'Date of birth must be in the past'
      })
    })
  })

  describe('phone number validation', () => {
    it('should be valid for valid phone number', () => {
      expect(validations.validatePhoneNumber('0113 496 0000').valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid for empty phone number', () => {
      expect(validations.validatePhoneNumber('')).toEqual({
        valid: false,
        message: 'Enter a telephone number'
      })
    })

    it('should not be valid for invalid phone number', () => {
      expect(validations.validatePhoneNumber('abd')).toEqual({
        valid: false,
        message: 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
      })
    })
  })

  describe('email validation', () => {
    it('should be valid for valid email address', () => {
      expect(validations.validateEmail('foo@example.com').valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid for empty email address', () => {
      expect(validations.validateEmail('')).toEqual({
        valid: false,
        message: 'Enter an email address'
      })
    })

    it('should not be valid for an invalid email address', () => {
      expect(validations.validateEmail('abd')).toEqual({
        valid: false,
        message: 'Please use a valid email address'
      })
    })
  })

  describe('password validation', () => {
    it(
      'should be valid for a not common password over 10 characters long',
      () => {
        expect(validations.validatePassword('over-10-cha').valid).toBe(true) // eslint-disable-line
      }
    )

    it('should not be valid for a password that is too short', () => {
      expect(validations.validatePassword('ashortstr')).toEqual({
        valid: false,
        message: 'Password must be 10 characters or more'
      })
    })

    it('should not be valid for a common password', () => {
      expect(validations.validatePassword('1234567890')).toEqual({
        valid: false,
        message: 'The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.'
      })
    })
  })

  describe('otp code validation', () => {
    it('should be valid for a valid OTP code', () => {
      expect(validations.validateOtp('123').valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid for empty OTP code', () => {
      expect(validations.validateOtp('')).toEqual({
        valid: false,
        message: 'Enter your verification code'
      })
    })

    it('should not be valid for an invalid OTP code', () => {
      expect(validations.validateOtp('abc')).toEqual({
        valid: false,
        message: 'Enter numbers only'
      })
    })
  })
})
