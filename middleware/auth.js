import passport from "passport";
import {Strategy as JwtStrategy, ExtractJwt} from "passport-jwt";
import {Strategy as LocalStrategy} from "passport-local";
import dotenv from "dotenv";
import user from "../models/user.js";
dotenv.config();

passport.use(
    'signup',
    new LocalStrategy(
        {
            usernameField: 'email',
            passReqToCallback:  true
        },
        async(req, email, password, done) =>{
            try{
                const newUser = await user.create({
                    email,
                    password,
                    first_name : req.body.first_name,
                    last_name: req.body.last_name,
                    username: req.body.username
                });

                const userWithoutPassword = newUser.toObject();
                delete userWithoutPassword.password;
                return done(null, userWithoutPassword);
            } catch(error){
                return done(error);
            }
        }
    )
)

passport.use(
    'signin',
    new LocalStrategy(
        {
            usernameField: 'email'
        },
        async(email, password, done) => {
            const fetchedUser = await user.findOne({email});

            if(!fetchedUser){
                return done(null, false, {message: "User not found"});
            }

            const validate = await fetchedUser.isValidPassword(password)

            if(!validate){
                return done(null, false, {message: "Invalid Credential"});               
            }

            const userWithoutPassword = fetchedUser.toObject();
            delete userWithoutPassword.password;
            return done(null, userWithoutPassword, {message: "Logged in successfully"});            
        }
    )
)

passport.use( new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    },
    async(token, done) => {
        try{
            const loggedInUser = await user.findOne({_id: token.sub})
            if(!loggedInUser){
                console.log("invalid auth");                
                return done(null, false);
            }
            console.log(loggedInUser);
            
            const userWithoutPassword = loggedInUser.toObject();
            delete userWithoutPassword.password;
            return done(null, userWithoutPassword);
        } catch(err){
            return done(err, false);
        }
    }
));

export const protect = passport.authenticate('jwt', {session: false});