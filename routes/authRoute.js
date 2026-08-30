import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const authRouter = express.Router();

authRouter.post(
    "/signup", (req, res, next) => {

    passport.authenticate('signup', {session: false}, (err, user, info) => {
        if(err){
            return res.status(500).json({
                message: 'Error creating user',
                error: err.message
            });
        }
        
        if(!user){
            return res.status(400).json({
                message: info?.message || 'Signup failed'
            });
        }

        res.status(201).json({
            message: "Signup successful",
            user: req.user
        });
    })(req, res, next);
});

authRouter.post(
    "/signin",
    async(req, res, next) => {
        passport.authenticate('signin', (err, user, info) => {
            try{
                if(err){
                    return next(err);
                }
                if(!user){
                    const error = new Error(info.message);
                    return next(error);
                }
                req.login(user, {session: false},
                    async(error) =>{
                        if(error){
                            return next(error);
                        }
                        const token = jwt.sign(
                            {sub : user._id},
                            process.env.JWT_SECRET,
                            {expiresIn: '1h'}
                        );
                        
                        res.json({token});
                    }
                )
            } catch(error){
                return next(error);
            }
        })(req, res, next)
    }
)

export default authRouter;