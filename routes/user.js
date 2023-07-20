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

// GET home page.
router.get('/', async function (req, res, next) {
  try {
    let user = req.session.user;
    console.log(user);
    let cartCount;
    if (user) {
      cartCount = await cartHelpers.getCartCount(req.session.user._id);
    }
    const products = await productHelper.getAllProducts();
    console.log('cartcount: ' + cartCount);
    res.render('user/view-products', { products, user, cartCount });
  } catch (error) {
    next(error);
  }
});

// user login
router.get('/login', (req, res, next) => {
  try {
    if (req.session.user) {
      res.redirect('/');
    } else {
      res.render('./user/login', {
        loginErr: req.session?.userloginErr,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/login', (req, res, next) => {
  userHelpers.doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.user = response.user;
        req.session.user.loggedIn = true;
        res.redirect('/');
      } else {
        req.session.userloginErr = 'Invalid username or Password';
        res.redirect('/login');
      }
    })
    .catch((error) => {
      next(error);
    });
});

/////////////////// user  sign up

router.get('/signup', (req, res, next) => {
  try {
    res.render('./user/signup', { admin: false });
  } catch (error) {
    next(error);
  }
});

router.post('/signup', (req, res, next) => {
  userHelpers
    .doSignup(req.body)
    .then((response) => {
      console.log(response);
      req.session.user = response;
      req.session.user.loggedIn = true;
      res.redirect('/');
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res, next) => {
  try {
    let user = req.session.user;
    let products = await cartHelpers.getCartProducts(req.session.user._id);
    let totalValue = await cartHelpers.getTotalAmount(req.session.user._id);
    res.render('user/cart', { user, products, totalValue });
  } catch (error) {
    next(error);
  }
});

router.get('/add-to-cart/:id', verifyLogin, (req, res, next) => {
  cartHelpers
    .addToCart(req.params.id, req.session.user._id)
    .then(() => {
      res.json({ status: true });
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/change-product-quantity', (req, res, next) => {
  cartHelpers
    .changeProductQuantity(req.body)
    .then(async (response) => {
      response.total = await cartHelpers.getTotalAmount(req.body.user);
      res.json(response);
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/remove-product', (req, res, next) => {
  cartHelpers
    .removeProduct(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/place-order', verifyLogin, async (req, res, next) => {
  try {
    let total = await cartHelpers.getTotalAmount(req.session.user._id);
    res.render('user/place-order', { total, user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.post('/place-order', async (req, res, next) => {
  try {
    let products = await cartHelpers.getCartProductList(req.body.userId);
    const totalPrice = await cartHelpers.getTotalAmount(req.body.userId);
    const response = await orderHelpers.placeOrder(req.body, products, totalPrice);

    console.log("response from placeorder", response.insertedId);
    if (req.body.paymentMethod === 'COD') {
      res.json({ COD: true });
    } else {
      const instanceOrderId = await userHelpers.generateRazorPay(response.insertedId, totalPrice);
      console.log("instanceOrderId from rzp: ", instanceOrderId);
      const orderId = response.insertedId;
      const user = req.session.user;
      res.status(200).json({ instanceOrderId, totalPrice, orderId, user });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/payment', async (req, res, next) => {
  try {
    console.log('payment req', req.body);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, rzpInstanceOrderId, mongodbOrderId } = req.body;
    await userHelpers.verifyPaymentSignature(razorpay_payment_id, razorpay_signature, rzpInstanceOrderId);
    await userHelpers.updatePaymentStatus(mongodbOrderId, razorpay_payment_id);
    res.status(200).json({ message: "payment verified successfully" });
  } catch (error) {
    next(error);
  }
});

router.get('/order-success', (req, res) => {
  try {
    res.render('user/order-success', { user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', verifyLogin, async (req, res, next) => {
  try {
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    if (orders.length > 0) {
      orders.forEach(element => {
        element.date = element.date.toLocaleDateString("en-US", options);
      });
    }
    res.render('user/orders', { user: req.session.user, orders });
  } catch (error) {
    next(error);
  }
});

router.get('/view-order-products/:id', async (req, res, next) => {
  try {
    let products = await orderHelpers.getOrderProducts(req.params.id);
    res.render('user/view-order-products', { user: req.session.user, products });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
