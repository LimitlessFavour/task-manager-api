const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const authMiddleware = require('../middleware/authentication');
const {sendWelcomeEmail, sendGoodbyeEmail} = require('../emails/account');
const router = new express.Router();

//creating the users creation endpoint.
router.post('/users', async (req, res) => {
    const user = new User(req.body); //creating an instance of the user.
    try {
        const token = await user.generateAuthToken();
        await user.save();
        //send a welcome email to the user after saving the data.
        await sendWelcomeEmail(user.email, user.name);
        res.status(201).send({user, token});
    } catch (error) {
        console.log(error);
        //setting the status code to be replied to the user.
        res.status(400).send(error); //-chaining method calls.
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});

    } catch (error) {
        console.log('we have a problem here');
        console.log(error);
        res.status(400).send(error);
    }
});

router.post('/users/logout', authMiddleware, async (req, res) => {
    try {
        //first,we obtain  and remove the particular token that was used when authenticating.
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });//so we are left with all other tokens apart from the one used to authenticate.

        await req.user.save(); //saving changes to the db.

        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/users/logoutAll', authMiddleware, async (req, res) => {
    try {
        //clear out all tokens to logout of all sessions.
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send();
    } catch (error) {
        res.status(500).send(error);
    }
})

const upload = multer({
    //  dest : "avatars",
    limits: {
        fileSize: 1000000, //file size limit of 1mb.
    },
    fileFilter(req, file, cb) {
        //checking if file uploaded is an image file.
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Upload an image file.'));
        }
        cb(undefined, true);
    }
})

router.post('/users/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    //making modifications on image data first
    const buffer = await sharp(req.file.buffer).resize(
        {
            width: 250,
            height: 250,
        },
    ).png().toBuffer();
    //setting avatar to modified image  data.
    req.user.avatar = buffer;
    await req.user.save();
    res.send({
        successMessage: "Avatar uploaded successfully",
    });
}, (error, req, res, next) => {
    res.status(400).send({error: error.message});
});

router.get('/users/me', authMiddleware, async (req, res) => {
    res.send(req.user);
},);

//getting the avatar of a user using the user's id.
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        //if there is no user or user avatar.
        if (!user || !user.avatar) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("No user or user avatar exists with that id");
        }
        res.set('Content-Type', 'image/png');
        //then we send the data back
        res.send(user.avatar);
    } catch (error) {
        res.status(400).send();
    }
});

//creating the single user(using its id) reading endpoint.
// noinspection FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id;
//     try {
//         const user = await User.findById(_id);
//
//         if (!user) {
//             // noinspection MagicNumberJS
//             return res.status(404).send;
//         }
//         res.send(user);
//     } catch (error) {
//         // noinspection MagicNumberJS
//         res.status(500).send(error);
//     }
// });

// noinspection FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
router.patch('/users/:id', authMiddleware, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({error: 'invalid updates'});
    }

    const id = req.user._id;
    try {
        //  const user = await User.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true});
        //to allow mongoose to use our middleware.
        const user = await User.findById(id);
        updates.forEach((update) => {
            user[update] = req.body[update];
        });
        user.save(); //note that if we were usng findByIdAndUpdate, no need for manual saving.
        // if (!user) { we know definitely that the user exists- just authenticated through the middleware.
        //     return res.status(404).send();
        // }
        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

// noinspection FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
router.delete('/users/me', authMiddleware, async (req, res) => {
    const id = req.user._id;     // const id = req.params.id;
    try {
        // const user = await User.findByIdAndDelete(id);
        // if (!user) {
        //     return res.status(400).send({error: "no user found"});
        // }
        await req.user.remove(); //removing the user provided from the middleware - you(req.user).
        sendGoodbyeEmail(req.user.email, req.user.name).then(
            () => {
                console.log('email sent');
            }
        ); //sending goodbye email to user.
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});

module.exports = router;