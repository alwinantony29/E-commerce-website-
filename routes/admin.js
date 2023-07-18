var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')

router.get('/login',(req,res,next)=>{
  
  if(req.session.user){
    res.redirect('/')
  }else
  res.render('./user/login',{"loginErr":req.session.userloginErr});
  req.session.user.loginErr=false
})

router.get('/', function(req, res, next) {
productHelper.getAllProducts().then((products)=>{ 
  
  res.render('admin/view-products',{admin:true,products}) 

})
});
router.get('/add-product',function(req,res){ 
  res.render('admin/add-product',{admin:true})
})
router.post('/add-product',(req,res)=>{
  
  
  productHelpers.addProduct(req.body,(_id)=>{
    console.log(_id);
    let image=req.files.Image
    image.mv('public/product-images/'+_id+'.jpg',(err,done)=>{
      if(!err){
        res.redirect("/admin") 
      }
      else{
        console.log(err);
      }
    })
    
  })
})
router.get('/delete-product/:id',(req,res)=>{
    let proId=req.params.id
    console.log(proId);
    productHelpers.deleteProduct(proId).then((response)=>{
      res.redirect('/admin')
    })
})
router.get('/edit-product/:id',async (req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  
  res.render('admin/edit-product',{admin:true,product})
})
router.post('/edit-product/:id',(req,res)=>{
    productHelpers.updateProduct(req.params.id,req.body).then(()=>{
      res.redirect('/admin')
      
      if(req.files){
        let image=req.files.Image
        image.mv('public/product-images/'+req.params.id+'.jpg')

        
      }
    })
})
module.exports = router;
