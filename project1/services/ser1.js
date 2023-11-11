const db = require('./db');
const helper = require('../helper');
const config = require('../config');

async function getMultiple(page = 1){
  const offset = helper.getOffset(page, config.listPerPage);
  const rows = await db.query(
    `SELECT * FROM customer_data LIMIT ${offset},${config.listPerPage}`
  );
  const data = helper.emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

async function create(customer){
  const approved_limit = 36*customer.monthly_salary;
  const result = await db.query(
    `INSERT INTO customer_data 
    (first_name, last_name, age, phone_number, monthly_salary, approved_limit) 
    VALUES 
    ('${customer.first_name}', '${customer.last_name}', ${customer.age}, ${customer.phone_number}, ${customer.monthly_salary}, ${approved_limit})`
  );

  let message = 'Error in creating customer';

  if (result.affectedRows) {
    message = 'Customer created successfully';
  }

  return {message, customer, approved_limit};
}

async function check_eligibility(request_body){
  const cust = await db.query(
    `SELECT * FROM customer_data WHERE customer_id=${request_body.customer_id};`
  );
  const result = await db.query(
    `SELECT * FROM loan_data WHERE customer_id=${request_body.customer_id} and end_date>CURRENT_DATE();`
  );
  const result1 = await db.query(
    `SELECT * FROM loan_data WHERE customer_id=${request_body.customer_id} and end_date<CURRENT_DATE();`
  );

  let credit_score = 0;
  let approval = false;
  let int_rate = request_body.interest_rate;
  for (let i=0; i<result1.length; i++){
    if (result1[i].EMIs_paid_on_Time==result1[i].tenure){
      credit_score = 100;
      approval = true;
      int_rate = 6;
    }
    else if ((0<(result1[i].tenure-result1[i].EMIs_paid_on_Time)<2) && ((result.length+result1.length)>5)){
      credit_score = 70;
      approval = true;
      int_rate = 10.5;
      break;
    }
    else if (0<(result1[i].tenure-result1[i].EMIs_paid_on_Time)<2){
      credit_score = 40;
      approval = true;
      int_rate = 14.5;
      break;
    }
    else if (2<(result1[i].tenure-result1[i].EMIs_paid_on_Time)<6){
      credit_score = 25;
      approval = true;
      int_rate = 18.5;
      break;
    }
  }
  
  let current_monthly_debt = 0;
  for(let j=0; j < result.length; j++){
    current_monthly_debt += result[j].monthly_payment;
  }
  if(current_monthly_debt>cust.monthly_salary){
      credit_score = 0;
      approval = false;
  }

  const  monthly_inst = (request_body.loan_amount/request_body.tenure)+ (((request_body.loan_amount*((request_body.tenure)/12)*int_rate)/100)/request_body.tenure); 
  
  let message = 'Error in creating eligibility';

  if (result.entries) {
    message = 'Eligibility checked successfully';
  }
  const given_interest_rate = request_body.interest_rate;
  const tenr = request_body.tenure;
  
  return {message, approval, given_interest_rate, int_rate, tenr, monthly_inst};
}

async function create_loan(request_body){
  const cust = await db.query(
    `SELECT * FROM customer_data WHERE customer_id=${request_body.customer_id};`
  );
  const result = await db.query(
    `SELECT * FROM loan_data WHERE customer_id=${request_body.customer_id} and end_date>CURRENT_DATE();`
  );
  const result1 = await db.query(
    `SELECT * FROM loan_data WHERE customer_id=${request_body.customer_id} and end_date<CURRENT_DATE();`
  );

  let credit_score = 0;
  let approval = false;
  let int_rate = request_body.interest_rate;
  for (let i=0; i<result1.length; i++){
    if (result1[i].EMIs_paid_on_Time==result1[i].tenure){
      credit_score = 100;
      approval = true;
      int_rate = 6;
    }
    else if ((0<(result1[i].tenure-result1[i].EMIs_paid_on_Time)<2) && ((result.length+result1.length)>5)){
      credit_score = 70;
      approval = true;
      int_rate = 10.5;
      break;
    }
    else if (0<(result1[i].tenure-result1[i].EMIs_paid_on_Time)<2){
      credit_score = 40;
      approval = true;
      int_rate = 14.5;
      break;
    }
    else if (2<(result1[i].tenure-result1[i].EMIs_paid_on_Time)<6){
      credit_score = 25;
      approval = true;
      int_rate = 18.5;
      break;
    }
  }
  
  let current_monthly_debt = 0;
  for(let j=0; j < result.length; j++){
    current_monthly_debt += result[j].monthly_payment;
  }
  if(current_monthly_debt>cust.monthly_salary){
      credit_score = 0;
      approval = false;
  }

  const  monthly_inst = (request_body.loan_amount/request_body.tenure)+ (((request_body.loan_amount*((request_body.tenure)/12)*int_rate)/100)/request_body.tenure); 
  const start_d = new Date().toISOString().split('T')[0];
  let end_d = new Date();
  let add_year = request_body.tenure/12;
  let add_month = request_body.tenure%12;
  end_d.setMonth(end_d.getMonth() + add_month);
  end_d.setFullYear(end_d.getFullYear() + add_year);
  end_d = end_d.toISOString().split('T')[0];
  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

  const load = await db.query(
    `INSERT INTO loan_data 
    (customer_id, loan_id, loan_amount, tenure, interest_rate, monthly_payment, EMIs_paid_on_Time, start_date, end_date) 
    VALUES 
    (${request_body.customer_id}, ${getRndInteger(1000,9999)}, ${request_body.loan_amount}, ${request_body.tenure}, ${int_rate}, ${monthly_inst}, 0, '${start_d}', '${end_d}')`
  );

  let message = 'Error in creating loan';

  if (load.affectedRows) {
    message = 'Loan created successfully';
  }

  const cust_id = request_body.customer_id;
  
  return {message, cust_id, approval, monthly_inst};
}

async function loan_details(loan_id){
  const result = await db.query(
    `SELECT customer_data.customer_id, customer_data.first_name, customer_data.last_name, customer_data.phone_number, customer_data.age, 
    loan_data.customer_id, loan_data.loan_id, loan_data.loan_amount, loan_data.tenure, loan_data.interest_rate, loan_data.monthly_payment FROM loan_data 
    RIGHT JOIN customer_data ON customer_data.customer_id = loan_data.customer_id 
    WHERE loan_data.loan_id = ${loan_id}`
  );

  let message = 'Error in fetching loan details';

  if (result.entries) {
    message = 'Loan details:';
  }

  const data = helper.emptyOrRows(result);

  return {message,data};
}

async function make_payment(customer_id, loan_id, amount){
  const result = await db.query(
    `SELECT * from loan_data 
    WHERE loan_data.loan_id = ${loan_id}
    AND loan_data.customer_id = ${customer_id}`
  );

  const data = result[0];
  const new_emi = data.EMIs_paid_on_Time + 1;
  let new_monthly_payment = data.monthly_payment;
  let m = 'equal';
  if (amount.value < data.monthly_payment){
    m = 'less';
    new_monthly_payment = ((data.monthly_payment - amount.value)/(data.tenure - new_emi)) + data.monthly_payment;
  }
  else if (amount.value > data.monthly_payment){
    m = 'more';
    new_monthly_payment = data.monthly_payment - ((amount.value - data.monthly_payment)/(data.tenure - new_emi));
  }

  const result1 = await db.query(
    `UPDATE loan_data 
    SET monthly_payment='${new_monthly_payment}', EMIs_paid_on_Time='${new_emi}'
    WHERE loan_id=${loan_id}`
  );

  let message = 'Error in processing EMI payment';

  if (result1.affectedRows) {
    message = 'Payment processed sucessfully';
  }

  return {message, new_monthly_payment, new_emi, m};
}

async function view_statement(customer_id, loan_id){
  const result = await db.query(
    `SELECT * FROM loan_data 
    WHERE loan_data.loan_id = ${loan_id}
    AND loan_data.customer_id = ${customer_id}`
  );

  let message = 'Error in fetching loan statement';

  if (result.entries) {
    message = 'Loan Statement:';
  }

  const data = {"customer_id":result[0].customer_id, "loan_id":result[0].loan_id, "principal":result[0].loan_amount, "interest_rate":result[0].interest_rate, "Amount_paid":((result[0].EMIs_paid_on_Time)*(result[0].monthly_payment)), "monthly_installment":result[0].monthly_payment, "repayments_left":((result[0].tenure)-(result[0].EMIs_paid_on_Time))};

  return {message,data};
}

module.exports = {
  getMultiple,
  create,
  check_eligibility,
  create_loan,
  loan_details,
  make_payment,
  view_statement
}