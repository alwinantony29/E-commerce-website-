var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
productHelper.getAllProducts().then((products)=>{
  console.log(products)
  console.log('bye');
  res.render('admin/view-products',{admin:true,products})

})
});
router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  
  
  productHelpers.addProduct(req.body,(_id)=>{
    console.log(_id);
    let image=req.files.Image
    image.mv('public/product-images/'+_id+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-product") 
      }
      else{
        console.log(err);
      }
    })
    
  })
})

module.exports = router;
