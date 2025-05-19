require('dotenv').config();
const mongoose=require("mongoose");
const URI=process.env.MONGODB_URI;
const connectDb=async()=>{
    try {
        await mongoose.connect(URI);
        console.log("connection succesful to db");
        
    } catch (error) {
        console.log("database connection failed");
        
    }
}

module.exports=connectDb;