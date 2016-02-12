var stripeKeys = require('./config'); //create config.js file (see config-example.js)
var stripe = require('stripe')(stripeKeys.secret);
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var amountToCharge = 999; // amount in cents

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('json spaces', 2);

app.post("/webhook", function(request, response) {
  // Retrieve the request's body and parse it as JSON
  var event_json = JSON.stringify(request.body);

  // Do something with event_json
  console.log("webhook receive");
  console.log(event_json);
  response.status(200).end();
});



//the view, client key is passed to ejs template
app.get("/", function (req, res) {
  res.render("index.ejs", { clientKey: stripeKeys.client, amountToCharge: amountToCharge });
});

var users = [];

//when form is submitted, stripe token will be sent to this route
app.post("/create_transaction", function (req, res) {

  // Replace with your user model
  var user = { 
    id: users.length,  
    stripeId: undefined, 
    hasValidCard: false 
  };
  users.push(user);

  // For testing purposes. Will be sent as the response to the submitted form.
  var jsonRes = {
    user: user,
    customer: undefined,
    card: undefined,
    charge: undefined,
    refund: undefined,
    error: undefined
  };

  // Get the credit card token from the form. Can only be used once.
  var stripeToken = req.body.stripeToken;

  // Demo workflow
  // Shows how to create a new customer, save a card for later use, charge the card, and refund the card
  stripe.customers.create({
    description: 'This is only a test.'  

  }).then(function whenCustomerIsCreated(customer) {
    jsonRes.customer = customer;
    user.stripeId = customer.id; 
    return stripe.customers.createCard(user.stripeId, {card: stripeToken});

  }).then(function whenCardIsCreated(card) {
    jsonRes.card = card;
    if(didChecksFail(card)) {
      handleFailedChecks(user);
      res.json(jsonRes); //FOR TESTING ONLY!
    } else {
      user.hasValidCard = true;
      return stripe.charges.create({
        amount: amountToCharge, 
        currency: "usd",
        customer: user.stripeId,
      });
    } 

  }).then(function whenChargeIsDone(charge) {    
    jsonRes.charge = charge;
    return stripe.charges.createRefund(charge.id, {});

  }).then(function whenRefundIsDone(refund) {
    jsonRes.refund = refund;
    res.json(jsonRes); //FOR TESTING ONLY!

  }).catch(function(err) {
    handleError(user, err);
    jsonRes.error = err;
    res.json(jsonRes); //FOR TESTING ONLY!

  }); //workflow

}); //app.post

//override this to handle failed cc checks
// https://stripe.com/docs/api/node#charge_object
var handleFailedChecks = function(user) {
  console.log('handleFailedChecks not implemented');
};

//override this to handle errors
// https://stripe.com/docs/api/node#errors
var handleError = function(user, error) {
  console.log('handleError not implemented');
};

// https://support.stripe.com/questions/what-controls-for-fraud-prevention-does-stripe-offer
var didChecksFail = function(card) {
  if(card.cvc_check === 'fail') {
    return true;
  }
  if(card.address_line1_check === 'fail') {
    return true;    
  }
  if(card.address_zip_check === 'fail') {
    return true;    
  }
  return false;
};


app.listen(3000);
