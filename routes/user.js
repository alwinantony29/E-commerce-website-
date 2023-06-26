const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers');
const { log } = require('debug/src/browser');
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else
    res.redirect('/login')
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = 0
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelper.getAllProducts().then((products) => {

    console.log('cartcount: ' + cartCount);
    res.render('user/view-products', { products, user, cartCount });
  })

});

// user login
router.get('/login', (req, res, next) => {
  if (req.session.user) {
    res.redirect('/')
  } else
    res.render('./user/login',
     { "loginErr": req.session?.userloginErr }
     );
  // req.session.user.loginErr = false
})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.user.loggedIn = true
      res.redirect('/')
    } else {
      req.session.userloginErr = "Invalid username or Password"
      res.redirect('/login')
    }
  })
})

// sign up

router.get('/signup', (req, res, next) => {
  res.render('./user/signup', { admin: false });
})

router.post('/signup', (req, res) => {

  userHelpers.doSignup(req.body).then((response) => {

    req.session.user = response
    req.session.user.loggedIn = true
    res.redirect('/')
  })
})


router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart', { user, products, totalValue })

})
router.get('/add-to-cart/:id', (req, res) => {

  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
    // res.redirect('/')
  })
})
router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)

    res.json(response)
  })
})
router.post('/remove-product', (req, res, next) => {
  userHelpers.removeProduct(req.body).then((response) => {
    res.json(response)
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total, user: req.session.user })
})
router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    console.log();

    if (req.body['payment-method'] == 'COD') {
      res.json({ status: true })
    } else {
      userHelpers.generateRazorPay()
    }


  })
  console.log(req.body);
})
router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})
router.get('/orders',verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  orders[0].date=orders[0].date.toLocaleDateString()
  res.render('user/orders', { user: req.session.user, orders })
})
router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products })
})
module.exports = router;
