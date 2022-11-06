var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let products=[
    {
      name:"blackforest",
      catogery:"cake",
      description:"nice chocolate cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcYG6vZfOMuWeC8Sfg73cOLbqDdZ-FmDARGQ&usqp=CAU"
    },
    {

      name:"whiteforest",
      catogery:"cake",
      description:"nice cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRijAXx0uX6pjAseTvf2O-RGOA_-o8G6sR6aA&usqp=CAU"

    },
    {
      name:"blackforest",
      catogery:"cake",
      description:"nice chocolate cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcYG6vZfOMuWeC8Sfg73cOLbqDdZ-FmDARGQ&usqp=CAU"
    },
    {

      name:"whiteforest",
      catogery:"cake",
      description:"nice cake",
      image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRijAXx0uX6pjAseTvf2O-RGOA_-o8G6sR6aA&usqp=CAU"

    },
  ]
  res.render('index', {products,admin:false});
});

module.exports = router;
