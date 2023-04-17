import { Schema, model } from "mongoose";

const user = new Schema({}, { timestamps: true });

const User = model("User", user);

export default User;
