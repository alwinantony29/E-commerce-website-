
var db = require('../config/connection')
var collection = require('../config/collections');
const { response } = require('express');
const { log } = require('debug/src/node');
var objectId = require('mongodb').ObjectId
module.exports = {

    addProduct: (product) => {
        console.log('function call');
        return new Promise((resolve, reject) => { 
            console.log(product);
            product.Price = parseFloat(product.Price)
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                resolve(data.insertedId)
            }).catch((error) => {
                console.log(error)
                reject(error)
            })
        })

    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                .then((products) => {
                    resolve(products)
                }).catch((error) => {
                    console.log(error)
                    reject(error)
                })
        })

    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id:new objectId(proId) }).then((response) => {
                console.log(response);
                resolve(response);
            }).catch((error) => {
                console.log(error)
                reject(error)
            })
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id:new objectId(proId) })
                .then((product) => {
                    resolve(product);
                })
                .catch((error) => {
                    console.log(error);
                    reject(error);
                });
        });
    },

    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id:new objectId(proId) }, {
                    $set: {
                        Name: proDetails.Name,
                        Description: proDetails.Description,
                        Price: proDetails.Price,
                        Category: proDetails.Category
                    }
                }).then((response) => {
                    console.log("done updating",response);
                    resolve()
                }).catch((err) => {
                    console.log(err);
                    reject(err)
                })
        })
    },

}