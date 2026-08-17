import mongoose from "mongoose";
import bcrypt from "bcrypt";

const {Schema, model} = mongoose;

const userSchema = new Schema({
    first_name:{type: String, require: true},
    last_name:{type: String, require: true},
    username:{type: String, require: true, unique: true, index: true},
    email:{type: String, require: true, unique: true, index: true},
    password:{type: String, require: true}
},
{
    timestamps: true
})

userSchema.pre(
    'save',
    async function(){
        if(!this.isModified('password')) return;

        const hash = await bcrypt.hash(this.password, 10);
        this.password = hash;
    }
)

userSchema.methods.isValidPassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

export default model("User", userSchema);