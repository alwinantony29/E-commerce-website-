const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
var router = express.Router();
const productHelper = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers');
const orderHelpers = require('../helpers/order-helpers');
const cartHelpers = require('../helpers/cart-helpers');
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
  console.log(user);
  let cartCount
  if (user) {
    cartCount = await cartHelpers.getCartCount(req.session.user._id)
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

/////////////////// user  sign up

router.get('/signup', (req, res, next) => {
  res.render('./user/signup', { admin: false });
})

router.post('/signup', (req, res) => {

  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
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
  let products = await cartHelpers.getCartProducts(req.session.user._id)
  let totalValue = await cartHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart', { user, products, totalValue })
})

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {

  cartHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
    // res.redirect('/')
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  cartHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await cartHelpers.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/remove-product', (req, res, next) => {
  cartHelpers.removeProduct(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await cartHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order', { total, user: req.session.user })
})

router.post('/place-order', async (req, res) => {
  let products = await cartHelpers.getCartProductList(req.body.userId)
  const totalPrice = await cartHelpers.getTotalAmount(req.body.userId)
  orderHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    console.log("response from placeorder", response.insertedId);
    if (req.body.paymentMethod == 'COD') {
      res.json({ COD: true })
    } else {
      userHelpers.generateRazorPay(response.insertedId, totalPrice).then((instanceOrderId) => {
        console.log("instanceOrderId from rzp: ", instanceOrderId)
        const orderId = response.insertedId
        const user = req.session.user
        res.status(200).json({ instanceOrderId, totalPrice, orderId, user })
      })
    }
  })
})

router.post('/payment', (req, res) => {

  console.log('payment req', req.body)
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, rzpInstanceOrderId, mongodbOrderId } = req.body
  userHelpers.verifyPaymentSignature(razorpay_payment_id, razorpay_signature, rzpInstanceOrderId).then(() => {
    userHelpers.updatePaymentStatus(mongodbOrderId, razorpay_payment_id)
    res.status(200).json({ message: "payment verified succesfully" })
  })
})

router.get('/order-success', (req, res) => {

  res.render('user/order-success', { user: req.session.user })

})

router.get('/orders', verifyLogin, async (req, res) => {

  let orders = await userHelpers.getUserOrders(req.session.user._id)
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  if (orders.length > 0) {
    orders.forEach(element => {
      element.date = element.date.toLocaleDateString("en-US", options)
    })
  }
  res.render('user/orders', { user: req.session.user, orders })
})

router.get('/view-order-products/:id', async (req, res) => {

  let products = await orderHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products })
})
module.exports = router;
