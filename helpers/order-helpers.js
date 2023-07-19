var db=require('../config/connection')
var collection=require('../config/collections');
module.exports = {
    getAllOrders: () => {

        return new Promise(async (resolve, reject) => {
            const orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find().toArray()
            resolve(orders)
        });
    }

}