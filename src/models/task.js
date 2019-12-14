const mongoose = require('mongoose');

//creating the schema.
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        required: true,
        ref : 'User', //creating the relationship between task and user.
        //so we can fetch the enitre User profile wkenever we have access to an individual task
    }
},{
    timestamps : true,
});

//creating task model using the schema
const Task = mongoose.model('Task', taskSchema);
module.exports = Task;