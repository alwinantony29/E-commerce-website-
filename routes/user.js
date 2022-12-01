var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
  
  productHelper.getAllProducts().then((products)=>{
  
    console.log(products);
    
    res.render('user/view-products', {products,admin:false});
  
  })
  
});

router.get('/login',(req,res,next)=>{
  res.render('./user/login',{admin:false});
})

router.get('/signup',(req,res,next)=>{
  res.render('./user/signup',{admin:false});
})

router.post('/signup',(req,res)=>{

  userHelpers.doSignup(req.body).then((response)=>{
      console.log(response); 
  })
})

router.post('/login',(req,res)=>{

  userHelpers.doLogin(req.body)
  
})

module.exports = router;
