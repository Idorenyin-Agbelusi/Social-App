import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import connectToMongoDb from "./db.js";
import './middleware/auth.js'
import authRouter from './routes/authRoute.js';
import postRouter from './routes/postRoute.js';
import userRouter from './routes/userRoute.js'
import passport from 'passport';

dotenv.config();
const app = express();
app.disable('etag');
app.use(express.static('public'))
const port = process.env.PORT;

connectToMongoDb();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(passport.initialize())

app.use('/auth', authRouter);
app.use('/posts', postRouter);
app.use('/users', userRouter);

app.get('/', (req, res) => {
    res.sendFile(path.resolve('public/index.html'));
})

app.listen(port, ()=>{
    console.log(`Server listening on port ${port}`);    
})