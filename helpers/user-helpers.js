var db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { log } = require('debug/src/browser')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const sha256 = require('js-sha256');
const crypto = require('crypto');
// const { ObjectId } = require('mongodb')

module.exports = {

    getUserList: () => {

        return new Promise(async (resolve, reject) => {
            try {
                const users = await db.get().collection(collection.USER_COLLECTION).find({}, { projection: { Password: 0 } }).toArray()
                console.log(users);
                resolve(users);
            } catch (error) {
                reject(error);
            }
        })
    },

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



    getUserOrders: (userId) => {

        return new Promise(async (resolve, reject) => {

            console.log("userid" + userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId:new objectId(userId) }).toArray()
            console.log("Orders: " + orders);
            resolve(orders)
        })
    },

    generateRazorPay: (mongoOrderId, amount) => {

        return new Promise(async (resolve, reject) => {

            console.log("params in grzp", mongoOrderId, amount);

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
            console.log("rzp sig", razorpay_signature);
            const data = rzpInstanceOrderId + "|" + razorpay_payment_id
            const generated_signature = sha256.hmac(secret, data)
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

        console.log("update params", id, paymentId);
        try {
            const result = await db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id:new objectId(id) }, { $set: { status: "placed", paymentId: paymentId } }, { returnOriginal: false })
            console.log("updation result: ", result);

        } catch (err) {
            console.log(err);
        }
    }


}