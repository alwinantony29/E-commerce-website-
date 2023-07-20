var db = require('../config/connection')
const collection = require('../config/collections');
var objectId = require('mongodb').ObjectId

module.exports = {

    getAllOrders: () => {

        return new Promise(async (resolve, reject) => {
            const orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find().toArray()
            resolve(orders)
        });
    },
    placeOrder: (order, products, total) => {

        return new Promise((resolve, reject) => {

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

            resolve(orderItems);
        })
    },
    getOrderDetails: async (orderID) => {
        return new Promise(async (resolve, reject) => {

            const orders = await db.get().collection(collection.ORDER_COLLECTION )
                .find({ _id: objectId(orderID) }).toArray()
            const userID = orders[0].userId
            const user = await db.get().collection(collection.USER_COLLECTION)
            .find({ _id: objectId(userID) }, { projection: { Password: 0 } }).toArray()
            resolve({ user: user[0], order: orders[0] })
        })
    },

}