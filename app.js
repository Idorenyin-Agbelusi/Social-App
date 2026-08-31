import express from 'express';
import path from 'path';
import './middleware/auth.js'
import authRouter from './routes/authRoute.js';
import postRouter from './routes/postRoute.js';
import userRouter from './routes/userRoute.js'
import passport from 'passport';

const app = express();
app.disable('etag');
app.use(express.static('public'))

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(passport.initialize())

app.use('/auth', authRouter);
app.use('/posts', postRouter);
app.use('/users', userRouter);

app.get('/', (req, res) => {
    res.sendFile(path.resolve('public/index.html'));
})

export default app;