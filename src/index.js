const express = require('express');
require('./db/mongoose'); //to ensure that the mongoose file runs.
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();

const port= process.env.PORT;

app.use(express.json());
//registering our routers.
app.use(userRouter);
app.use(taskRouter);


app.listen(port, () => {
    console.log('Server is up on port ' + port);
});
