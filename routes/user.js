var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')


/* GET home page. */
router.get('/', function(req, res, next) {
  
  productHelper.getAllProducts().then((products)=>{
    console.log('hiiii');
    console.log(products);
    console.log('bye');
    res.render('index', {products,admin:false});
  
  })
  
});

module.exports = router;
