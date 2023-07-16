var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { log } = require('debug/src/browser')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { RazorpayCheckout } = require('razorpay');
const sha256 = require('js-sha256');
const crypto = require('crypto');
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')

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
            try {
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
            } catch (err) { console.log(err); }
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
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            // console.log(order, products, total);
            let status = order.paymentMethod === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order.paymentMethod,
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
            try {
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                resolve(cart.products)
            } catch (err) {
                console.log(err);
            }
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
            // console.log(orderItems);
            resolve(orderItems);
        })
    },
    generateRazorPay: (mongoOrderId, amount) => {
        return new Promise(async (resolve, reject) => {
            console.log("params in grp", mongoOrderId, amount);
            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_SECRET,
            });
            const options = {
                amount: amount * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + mongoOrderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) console.log(err);
                console.log("razorpay order details:", order);
                resolve(order.id)
            });
        })
    },
    verifyPaymentSignature: (razorpay_payment_id, razorpay_signature, rzpInstanceOrderId) => {
        return new Promise(async (resolve, reject) => {
            const secret = process.env.RAZORPAY_SECRET
            console.log("pid", razorpay_payment_id)
            console.log("sig", razorpay_signature);
            const data = rzpInstanceOrderId + "|" + razorpay_payment_id
            const generated_signature = sha256.hmac(secret, data)
            // const generated_signature = crypto
            //     .createHmac('sha256', secret)
            //     .update(data)
            //     .digest('hex');
            console.log("generated signature:", generated_signature)
            if (generated_signature == razorpay_signature) {
                console.log("signature matched , payment is successful")
                resolve()
            } else {
                console.log("signature mismatch try again")
            }
        })
    },
    updatePaymentStatus: async (id, paymentId) => {
        console.log("update params",id,paymentId);
        try {
            const result = await db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectId(id) }, { $set: { status: "placed", paymentId: paymentId } },{ returnOriginal: false })
            console.log("updation result: ", result);

        } catch (err) {
            console.log(err);
        }
    }


}