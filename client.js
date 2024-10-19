document.addEventListener('DOMContentLoaded', function() {
    const resultContainer = document.getElementById('resultContainer');
    const currencySelect = document.getElementById('currency');
    const soapEndpoint = "http://localhost:8044/bankService?wsdl"; // Your SOAP endpoint URL
    const namespace = "http://service/"; // Replace with your SOAP namespace from the WSDL

    function callSoapMethod(methodName, parameters) {
        let soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="${namespace}">
                <soapenv:Body>
                    <ns:${methodName}>`;

        if (parameters) {
            for (const param in parameters) {
                soapEnvelope += `<ns:${param}>${parameters[param]}</ns:${param}>`;
            }
        }

        soapEnvelope += `</ns:${methodName}>
                </soapenv:Body>
            </soapenv:Envelope>`;

        return fetch(soapEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `"${namespace}${methodName}"`,
            },
            body: soapEnvelope,
        })
            .then(response => response.text())
            .then(xmlString => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, "text/xml");
                const result = xmlDoc.querySelector('ns\\:return').textContent;
                return result;
            });
    }

    // Populate currency dropdown
    callSoapMethod("getAllCurrencies")
        .then(xmlString => {
            console.log(xmlString);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");
            const currencies = Array.from(xmlDoc.querySelectorAll('ns\\:return')).map(node => node.textContent);
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency;
                option.text = currency;
                currencySelect.appendChild(option);
            });
        })
        .catch(displayError);

    // Form submission handlers
    document.getElementById('euroToTndForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('tndToAnyForm').addEventListener('submit', handleFormSubmit);

    function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const amount = form.querySelector('input[name="amount"]').value;
        let methodName, params;

        if (form.id === 'euroToTndForm') {
            methodName = "convertEuroToTnd";
            params = { amount: amount };
        } else {
            methodName = "convertTndToAny";
            const currency = form.querySelector('#currency').value;
            params = { amount: amount, currency: currency };
        }

        callSoapMethod(methodName, params)
            .then(result => displayResult(createResultMessage(methodName, amount, params.currency, result)))
            .catch(displayError);
    }


    function createResultMessage(methodName, amount, currency, result) {
        if (methodName === "convertEuroToTnd") {
            return `${amount} Euros en TND : ${result} TND`;
        } else {
            return `${amount} TND en ${currency} : ${result} ${currency}`;
        }
    }

    function displayResult(message) {
        resultContainer.innerHTML = `<div class="alert alert-success" role="alert">${message}</div>`;
    }

    function displayError(error) {
        console.error('Error:', error);
        resultContainer.innerHTML = `<div class="alert alert-danger" role="alert">An error occurred: ${error.message || 'Check console for details'}</div>`;
    }


});