var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')
const userHelpers=require('../helpers/user-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else
      res.redirect('/login')
}
/* GET home page. */
router.get('/',async function(req, res, next) {
    let user=req.session.user
    let cartCount=0
    if(user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
    }
  productHelper.getAllProducts().then((products)=>{
  
    console.log(cartCount);
    
    res.render('user/view-products', {products,user,cartCount});
  
  })
  
});

router.get('/login',(req,res,next)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else
  res.render('./user/login',{"loginErr":req.session.loginErr});
  req.session.loginErr=false
})

router.get('/signup',(req,res,next)=>{
  res.render('./user/signup',{admin:false});
})

router.post('/signup',(req,res)=>{

  userHelpers.doSignup(req.body).then((response)=>{
      req.session.loggedIn=true
      req.session.user=response
      res.redirect('/')
  })
})

router.post('/login',(req,res)=>{

  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr="Invalid username or Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart',verifyLogin,async(req,res)=>{
  let user=req.session.user
   let products=await userHelpers.getCartProducts(req.session.user._id)
  
  res.render('user/cart',{user,products})
  console.log(products);
})
router.get('/add-to-cart/:id',(req,res)=>{
   console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
   res.json({status:true})
    // res.redirect('/')
  })
})
module.exports = router;
 