var objectId = require('mongodb').ObjectId
const collection = require('../config/collections')
var db=require('../config/connection')

module.exports={
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log('proexist' + proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }).then((response) => {
                                resolve()
                            })
                }
            } else {
                let cartObj = {

                    user: objectId(userId),
                    products: [proObj],
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }

                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(cartItems);
        })
    },
    
    getCartCount: (userId) => {

        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                cart.products.forEach(element => {
                    console.log(element.quantity);
                    count += element.quantity
                });
            }
            resolve(count)
        })
    },
    
    changeProductQuantity: (details) => {

        let count = parseInt(details.count)
        let quantity = parseInt(details.quantity)
        console.log("changeProductQuantityDetails: ",details);

        return new Promise((resolve, reject) => {
 
            if (count == -1 && quantity == 1) {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }).then((response) => {
                        console.log(response);
                        resolve({ removeProduct: true })
                    })
            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': count }
                        }).then((response) => {
                            console.log(response);
                            resolve({ status: true })
                        })
            }



        })
    },
    getTotalAmount: (userId) => {

        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }

                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }, {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$quantity", { $toDouble: '$product.Price' }] } }
                    }
                }

            ]).toArray()
            if (total[0]) {

                console.log("total:", total[0].total);
                resolve(total[0].total)

            } else resolve(0)
        })

    },
    getCartProductList: (userId) => {

        return new Promise(async (resolve, reject) => {

            try {

                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                resolve(cart.products)

            } catch (err) {

                console.log(err);
            }
        })
    },
    removeProduct: (details) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                {
                    $pull: { products: { item: objectId(details.product) } }
                }).then((response) => {
                    console.log(response);
                    resolve({ removeProduct: true })
                })
        })
    },
}