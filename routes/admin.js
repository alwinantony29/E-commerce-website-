var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var orderHelpers = require('../helpers/order-helpers');
const userHelpers = require('../helpers/user-helpers');
const { log } = require('debug/src/browser');

router.get('/login', (req, res, next) => {
  try {
    if (req.session.user) {
      res.redirect('/admin/login');
    } else {
      res.render('./user/login', { "loginErr": req.session.userloginErr });
      req.session.user.loginErr = false;
    }
  } catch (error) {
    next(error);
  }
});

router.get('/', async function (req, res, next) {
  try {
    const products = await productHelpers.getAllProducts();
    res.render('admin/view-products', { admin: true, products });
  } catch (error) {
    next(error);
  }
});

router.get('/add-product', function (req, res) {
  res.render('admin/add-product', { admin: true });
});

router.post('/add-product', (req, res, next) => {
  
    productHelpers.addProduct(req.body).then((_id)=>{
      console.log(_id);
      let image = req.files.Image;
      image.mv('public/product-images/' + _id + '.jpg', (err, done) => {
        if (!err) {
          res.redirect("/admin");
        } else {
          console.log(err);
        }
      })}).catch (error=>{
    next(error);
  })
})


router.get('/delete-product/:id', (req, res, next) => {
  try {
    let proId = req.params.id;
    console.log(proId);
    productHelpers.deleteProduct(proId).then((response) => {
      res.redirect('/admin');
    });
  } catch (error) {
    next(error);
  }
});

router.get('/edit-product/:id', async (req, res, next) => {
  try {
    let product = await productHelpers.getProductDetails(req.params.id);
    res.render('admin/edit-product', { admin: true, product });
  } catch (error) {
    next(error);
  }
});

router.post('/edit-product/:id', async (req, res, next) => {
  try {
     await productHelpers.updateProduct(req.params.id, req.body);
    if (req.files) {
      let image = req.files.Image;
      image.mv('public/product-images/' + req.params.id + '.jpg');
    }
    res.redirect('/admin');
  } catch (error) {
    console.log(error);
    next(error);
  }
})

router.get('/orders', (req, res, next) => {
  try {
    orderHelpers.getAllOrders().then((orderList) => {
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      if (orderList.length > 0) {
        orderList.forEach(element => {
          element.date = element.date.toLocaleDateString("en-US", options);
        });
      }
      res.render('admin/view-orders', { admin: true, orderList });
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const userList = await userHelpers.getUserList();
    res.render('admin/view-users', { userList: userList, admin: true });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:orderID", (req, res, next) => {
  try {
    const orderID = req.params.orderID;
    orderHelpers.getOrderDetails(orderID).then(({ user, order }) => {
      console.log(user, order);
      res.json({ user, order });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
