const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}
module.exports.connect = async (done) => {
    const url = process.env.MONGODB_URI
    const dbname = 'shopping'

    // mongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, data) => {
    //     if (err) return done(err)
    //     state.db = data.db(dbname)
    //     done()
    // })
    const client = new mongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

    console.log("connecting")
    await client.connect().then(() => {
        console.log("connecting done")
        state.db = client.db(dbname)
        done();
    }).catch(err => {
        console.log("catched error", err);
        return done(err);
    })

}

module.exports.get = () => {
    return state.db
}