
var db=require('../config/connection')
var collection=require('../config/collections');
const { response } = require('express');
const { log } = require('debug/src/node');
var objectId=require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        console.log(product);
        product.Price=parseFloat(product.Price)
        
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
    
           
            callback(data.insertedId)
        })

    },
    getAllProducts:(callback)=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
     deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(proId)}).then((response)=>{
                console.log(response);
                resolve(response);
            })
        })
     },
     getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product);
            })
        })
     },
     updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
            }).then((response)=>{
                resolve()
            })
        })
     }

}