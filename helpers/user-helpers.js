var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
module.exports={

    doSignup:(userData)=>{

        return new Promise(async(resolve,reject)=>{
            console.log(userData);
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData)
            resolve(userData)
        })
       

    },

    doLogin:(userData)=>{
        console.log(userData);
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            console.log(user);
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    console.log(status);
                        if(status){
                            console.log("login succesful");
                        }else{
                            console.log("login failed");
                        }
                })
            }else{
                console.log("login failed");
            }
            console.log(user);
        })
    }

}