const Env = use('Env')
const View = use('View')
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(Env.get('SENDGRID_API_KEY'));
const MAIL_FROM_EMAIL = Env.get('MAIL_FROM_EMAIL') ? Env.get('MAIL_FROM_EMAIL') : "gatekeeper@example.com"

module.exports =  {
   
    async send(templatePath, data, callback) {
       
       let message = { to: "", from: "", subject: ""};
       
       callback({
           to (val) { message.to = val },
           from (val) { message.from = val },
           subject (val) { message.subject = val }
       });
       
       return await sgMail.send({
          to: message.to,
          from: (message.from) ? message.from : MAIL_FROM_EMAIL, // Use the email address or domain you verified above
          subject: message.subject,
          html: View.render(templatePath, data)
        })
        .then(() => {
            //console.log('sent', message)
        }, error => {
            console.log('error', message)
          console.error(error);
          if (error.response) {
            console.error(error.response.body)
          }
        });
        
        

   }
}