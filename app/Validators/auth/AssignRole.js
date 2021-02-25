'use strict'

class AssignRole {

  get rules () {
    return {
      userId: 'required',
      role: 'required'
    }
  }

  get sanitizationRules() {
    return {
      // it has prblm with dots in email
      // me.amitkhare@gmail.com => meamitkhare@gmail.com
      // email: 'normalize_email'
    }
  }
  
  get data () {
    const requestBody = this.ctx.request.all()
    return requestBody
  }
  
  get messages () {
    return {
      'userId.required': 'userId can\'t be empty.',
      'role.required': 'Role can\'t be empty.'
    }
  }
  
  async fails (errors) {
    return this.ctx.response.status(400).json({ 
        message: this.ctx.request.parrot.formatMessage('http.request.malformed'),
        errors: errors
    })
  }

}

module.exports = AssignRole
