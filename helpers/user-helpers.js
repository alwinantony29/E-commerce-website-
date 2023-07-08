var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { log } = require('debug/src/browser')
var objectId = require('mongodb').ObjectId

module.exports = {

    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {
            console.log(userData);
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((userData) => {
                resolve(userData)
            })

        })


    },

    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })

            if (user) {
                console.log(user);
                bcrypt.compare(userData.Password, user.Password).then((status) => {

                    if (status) {
                        console.log("login succesful");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login failed");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("login failed");
                resolve({ status: false })

            }

        })
    },
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
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{prodList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id',"$$prodList"]
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
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
        console.log(count, quantity);
        console.log(details);
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
                        total: { $sum: { $multiply: ["$quantity",{$toDouble: '$product.Price'}] } }
                    }
                }

            ]).toArray() 
            if (total[0]) {
                console.log("total:" + total[0].total);
                resolve(total[0].total)
            }else resolve(0)
        })

    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response)


            })
        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log("userid" + userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).toArray()
            console.log("Orders: " + orders);
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
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
            console.log(orderItems);
            resolve(orderItems);
        })
    }


}