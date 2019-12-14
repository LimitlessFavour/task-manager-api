const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

//creating the schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        unique: true, //canot use the same email multiple times.
        required: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        trim: true,
        minlength: 7,
        required: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('password cannot contain "password"');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age cannot be less than zero.');
            }
        }
    },
    //contains the list of tokens.each token will be an object with just the token field...lol.
    tokens: [{
        token : {
            type : String,
            required : true,
        }
    },],
    avatar : {
      type : Buffer,
    },
},{
    timestamps : true,
});
//vitural property - A way for monoggose to fighure out how these two things are related.
//we didnt need to use virtual property when referencing User from the Task model
//because Owner is stored as a real field in the Task model.

//however since no field that corresponds to task is stored in the User model as a real field
//we have to employ virtual property to create a Task reference from the User.
userSchema.virtual('tasks',{
    ref : 'Task',
    localField : '_id', //field where the data is stored(which is the  user id  in this case).
    foreignField : 'owner', //i.e field on the other model(in this case Task model) that is referenced(i.e the Owner field).
})


userSchema.methods.generateAuthToken = async function () {
    const user = this; //the instance of user that calls this method.
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({token : token}) //adding the token to the tokens list in the model.
    await user.save();  //ensuring that the token gets saved into teh database.

    return token;
}

//this will run anytime the user object is rendered.
userSchema.methods.toJSON = function(){
    const user = this;
    //convertoing the user to a json object.
    const userObject = user.toObject();
    //performing operations to hide the sensitive data (password and token in this case).
    delete userObject.password;
    delete userObject.tokens;
    //we also want to hide avatar sinc eit is alrge and might slow down our work while rendering it.
    delete userObject.avatar;

    return userObject;
}

//setting up our own built option- findByCredentials.
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({
        email: email,
    });

    if (!user) {
        throw new Error('Unable to Login.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log('passwords do not match');
        throw new Error('Unable to Login.');
    }
    return user;
}

//Setting up the middleware on the schema(to hash the plain text password) right before the 'save' event.
userSchema.pre('save', async function (next) {
    const user = this;  //this points to what is saved
    //password-hashing.
    //checking to see if password was modified so we can hash it.
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

//setting the middleware on the schema right before the remove event.
userSchema.pre('remove',async function (next) {
    const user = this;
    //deleting all the tasks that have the current user's id as the value in the ownerfield.
    await Task.deleteMany({owner : user.id});
    next();
});

//creating the user model using our userSchema.
const User = mongoose.model('User', userSchema);

module.exports = User;

