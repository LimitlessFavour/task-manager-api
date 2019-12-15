const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

const sendWelcomeEmail = async (email,name) => {
    //send welcome email
    await sgMail.send({
        to : email,
        from : "oketolulope3@gmail.com",
        subject : 'Welcome to the Task Manager app.',
        text: `Welcome to the app,${name}.Let me know how you get along with the app.`,
    });
}

const sendGoodbyeEmail = async (email,name) => {
    const firstName = name.split(' ')[0];
    //send goodbye email.
    await sgMail.send({
        to : email,
        from : "oketolulope3@gmail.com",
        subject : `We are sorry to see you go, ${firstName}`,
        text: `Sorry to see you deleted your account,${name}.Please let us know why you deleted it and if there anything we could have done to have made your experience better.`,
    });
}

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail,
};



