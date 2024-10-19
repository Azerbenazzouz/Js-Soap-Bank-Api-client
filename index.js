const express = require('express');
const soap = require('strong-soap').soap;
const app = express();

const wsdlUrl = 'http://localhost:8044/bankService?wsdl'; // Ensure your WSDL is available

let soapClient;

// Middleware to create SOAP client once and reuse it
app.use((req, res, next) => {
  if (soapClient) return next(); // If client already exists, proceed
  soap.createClient(wsdlUrl, (err, client) => {
    if (err) {
      console.error('Error creating SOAP client:', err);
      return res.status(500).send('Could not create SOAP client');
    }
    soapClient = client;
    next();
  });
});

// Route to convert Euro to TND
app.get('/convertEuroToTnd', (req, res) => {
  const amount = parseFloat(req.query.amount);

  if (isNaN(amount)) {
    return res.status(400).send('Invalid amount');
  }

  const args = { amount };

  soapClient.convertEuroToTnd(args, (err, result) => {
    if (err) {
      console.error('Error calling SOAP method:', err);
      return res.status(500).send('Error calling SOAP method');
    }

    res.json({
      originalAmount: amount,
      convertedAmount: result.return // Assuming `return` contains the result
    });
  });
});

// Route to convert USD to any currency
app.get('/convertUsdToAny', (req, res) => {
  const amount = parseFloat(req.query.amount);
  const currency = req.query.currency;

  if (isNaN(amount) || !currency) {
    return res.status(400).send('Invalid amount or currency');
  }

  const args = { amount, currency };

  soapClient.convertUsdToAny(args, (err, result) => {
    if (err) {
      console.error('Error calling SOAP method:', err);
      return res.status(500).send('Error calling SOAP method');
    }

    res.json({
      originalAmount: amount,
      convertedAmount: result.return // Assuming `return` contains the result
    });
  });
});

// Route to get all currencies
app.get('/getAllCurrencies', (req, res) => {
  soapClient.getAllCurrencies({}, (err, result) => {
    if (err) {
      console.error('Error calling SOAP method:', err);
      return res.status(500).send('Error calling SOAP method');
    }

    res.json(result.return); // Assuming `return` contains the list of currencies
  });
});

// Start the Express server
const PORT = 3044;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
