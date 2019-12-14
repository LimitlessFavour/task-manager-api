const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        let token = req.header('Authorization'); //accept incoming headers - since we will be paasint our token through the request headers.
        //Authorization is the key passed through the header. We pbtain the corresponding value and store it in our "token" variable.

        //to obtain our jwt out of our value from the header we have to remove the bearer portion from it.
        token = token.replace('Bearer ', '');

        //now we want to make sure that the token is actually valid-so we continue to use decoded from here on.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //now,to grab the user from the database,we use the user's id which is part of our token(decoded).
        const user = await User.findOne({
            _id: decoded._id,
            'tokens.token': token,
        });
        //if no user found.
        if (!user) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("No user found.");
        }
        //adding our token onto the request body so that our route handlers can make use of it later- such as in cases of logging out.
        req.token = token;
        //ading our user on to request so that our route handler will be able to access and use the user.
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({
            error: "Please authenticate properly",
        });
        console.log(error);
    }
}

module.exports = auth;