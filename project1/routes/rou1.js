const express = require('express');
const router = express.Router();
const ser1 = require('../services/ser1');

/* GET customers. */
router.get('/getcustomer', async function(req, res, next) {
  try {
    res.json(await ser1.getMultiple(req.query.page));
  } catch (err) {
    console.error(`Error while getting customers `, err.message);
    next(err);
  }
});

/* POST customer */
router.post('/register', async function(req, res, next) {
  try {
    res.json(await ser1.create(req.body));
  } catch (err) {
    console.error(`Error while creating customer`, err.message);
    next(err);
  }
});

/* POST eligibility */
router.post('/check-eligibility', async function(req, res, next) {
  try {
    res.json(await ser1.check_eligibility(req.body));
  } catch (err) {
    console.error(`Error while checking eligibility`, err.message);
    next(err);
  }
});

/* POST create loan */
router.post('/create-loan', async function(req, res, next) {
  try {
    res.json(await ser1.create_loan(req.body));
  } catch (err) {
    console.error(`Error while creating loan`, err.message);
    next(err);
  }
});

/* POST loan details */
router.get('/view-loan/:loan_id', async function(req, res, next) {
  try {
    res.json(await ser1.loan_details(req.params.loan_id));
  } catch (err) {
    console.error(`Error while fetching loan details`, err.message);
    next(err);
  }
});

/* POST emi payment */
router.post('/make-payment/:customer_id/:loan_id', async function(req, res, next) {
  try {
    res.json(await ser1.make_payment(req.params.customer_id, req.params.loan_id, req.body));
  } catch (err) {
    console.error(`Error while processing payment`, err.message);
    next(err);
  }
});

/* GET view statement */
router.get('/view-statement/:customer_id/:loan_id', async function(req, res, next) {
  try {
    res.json(await ser1.view_statement(req.params.customer_id, req.params.loan_id));
  } catch (err) {
    console.error(`Error while fetching statement`, err.message);
    next(err);
  }
});

module.exports = router;