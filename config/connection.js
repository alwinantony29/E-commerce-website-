const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=(done)=>{
    const url='mongodb://0.0.0.0:27017'
    const dbname='shopping'

    mongoClient.connect(url,{useNewUrlParser:true,useUnifiedTopology: true },(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })

}

module.exports.get=()=>{
    return state.db
}