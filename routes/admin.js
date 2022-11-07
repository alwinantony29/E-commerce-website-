var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {

  let products=[
    {
      name:"blackforest",
      category:"cake",
      description:"nice chocolate cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcYG6vZfOMuWeC8Sfg73cOLbqDdZ-FmDARGQ&usqp=CAU"
    },
    {

      name:"whiteforest",
      category:"cake",
      description:"nice cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRijAXx0uX6pjAseTvf2O-RGOA_-o8G6sR6aA&usqp=CAU"

    },
    {
      name:"blackforest",
      category:"cake",
      description:"nice chocolate cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcYG6vZfOMuWeC8Sfg73cOLbqDdZ-FmDARGQ&usqp=CAU"
    },
    {

      name:"whiteforest",
      category:"cake",
      description:"nice cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRijAXx0uX6pjAseTvf2O-RGOA_-o8G6sR6aA&usqp=CAU"

    },
  ]

  res.render('admin/view-products',{admin:true,products})
});
router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  console.log(req.body);
  console.log(req.files.Image);
  productHelpers.addProduct(req.body,(result)=>{
    res.render("admin/add-product")
  })
})

module.exports = router;
