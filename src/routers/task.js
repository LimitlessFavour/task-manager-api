const express = require('express');
const Task = require('../models/task');
const User = require('../models/user');
const authMiddleware = require('../middleware/authentication');
const router = new express.Router();


//creating the tasks creation endpoint.
router.post('/tasks', authMiddleware, async (req, res) => {
    //  const task = new Task(req.body);
    const task = new Task({
        //since the owner id is not contained in the req.body it will have to added seperately.
        //therefore using the spread operator to obtain the whole req.body a nd then specify the owner id all in the object.
        ...req.body,
        owner: req.user._id,
    });

    try {
        await task.save();
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error);
    }
});

//GET /tasks?completed=true
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', authMiddleware, async (req, res) => {
    const match = {};
    const sort = {};

    if (req.query.completed) {//if the 'completed' query exists.
        //however note that req.query.complted will be obtained from the url as a string
        //and not a boolean.so we convert it from the string to boolean before setting it in the match object.
        match.completed = req.query.completed === 'true'
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
    try {
        // const tasks = Task.find({
        //     owner : req.user._id,
        // });
        // await req.user.populate('tasks').execPopulate();
        await req.user.populate({
            path: 'tasks',
            match: match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: sort,
            },
        }).execPopulate();
        res.send(req.user.tasks);

    } catch (error) {
        res.status(500).send(error);
    }
});

//creating the single task(using its id) reading endpoint.
// noinspection FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
router.get('/tasks/:id', authMiddleware, async (req, res) => {
    const _id = req.params.id;
    try {
        // const task = await Task.findById(_id);
        //we will use findOne method instead of findById because we can add the extra condition
        //of fetching only the task created by the user-(recall that user id is
        await req.user.populate('tasks').execPopulate();
        res.send(req.user.tasks);

        //alternative to fetching the tasks for just the logged in user would be:
        const task = await Task.findOne({_id, owner: req.user._id});
        if (!task) {
            res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

// noinspection FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
router.patch('/tasks/:id', authMiddleware, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({error: 'invalid updates'});
    }
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id,
        });

        if (!task) {
            return res.status(404).send();
        }
        updates.forEach((update) => {
            task[update] = req.body[update];
        });
        await task.save();
        res.send(task);
    } catch (error) {
        res.status(400).send(error);
    }
});

// noinspection FunctionWithInconsistentReturnsJS,FunctionWithMultipleReturnPointsJS
router.delete('/tasks/:id', authMiddleware, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOneAndDelete({
            _id,
            owner: req.user._id,
        });
        if (!task) {
            return res.status(400).send({error: "no task found"});
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/users/me/avatar',authMiddleware,(req,res)=>{
   try{
       req.user.avatar = undefined; //deleting whatever contents in the avatar field.
       req.user.save(); //saving changes to the db.
       res.send();
   }catch(error){
       res.status(400).send(error);
   }
});

module.exports = router;