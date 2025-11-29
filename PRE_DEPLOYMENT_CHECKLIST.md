Skip to main content
Cashfree Payments Developer Documentation home pagelight logo

Search or ask...
Ctrl K
Discord
Create Account

Payments
Payouts
Secure ID
Partners and Platforms
API Reference
AI and Tools
Help Center
Payments
Introduction
Dashboard
Payment Gateway

Cashfree Hosted Checkout
Integration
Custom Checkout Integration - Android
Custom Checkout Integration - iOS

Mobile Integration

Custom Web Checkout
Overview
SDK Libraries
Introducing Cashfree.js

Components
Customize a Component
Configuring Payment Options
Examples
Appendix
BNPL Plus - Native Web

No Code

Webhooks

Going Live

Resources

Manage

Features

Quick Guide
General FAQs
Checkout

Shopify
WooCommerce
Customise Checkout

One Click Checkout

Improving Conversion

After Payment
Social Proofing
Cashfree Trusted Badge
International Payments

Collect from India

Collect from the World
Flowwise
Overview
Add a gateway

Configure
FAQs
RiskShield
Overview
Fraud Risk Indicator
Risky Transactions

Setup Rules
Subscription

Overview

Integration

Manage Subscription or Payments
FAQs
Other Products
Overview

Easy Split

softPOS

BBPS Billers

Virtual Bank Accounts (VBAs)
Developer updates

Changelog

On this page

Try it in DevStudio
Why choose Cashfree?
Pre-requisites
Step 1: Creating an order
Step 2: Opening the checkout page
1. Include JS SDK in your client code
2. Initialise the SDK
3. Open Cashfree checkout
Step 3: Confirming the payment
Order status verification
Testing
💻 Quick dev-to-dev talk
Related topics

Create Order API
Get Order API
Domain Whitelisting
Payment SDKs
Cashfree Hosted Checkout
Cashfree Hosted Checkout

Open in ChatGPT

Cashfree’s web checkout offers merchants a secure, pre-built, and user-friendly interface that supports a wide variety of payment methods, enhancing the transaction experience for both merchants and customers.
​
Why choose Cashfree?
Simplified checkout: Provides a pre-built, easy-to-use checkout page that delivers an optimised payment experience. It accepts payments from over 120 payment methods easily and securely.
Secure and PCI compliant: Securely collects payment details and submits them directly to Cashfree servers, removing the need for Payment Card Industry Data Security Standard (PCI DSS) compliance requirements at the merchant’s end.
Personalised: Customise your payment methods, branding, and various other elements to align seamlessly with your company’s specific theme.
​
Pre-requisites
Create a Cashfree Merchant Account.
Log in to the Merchant Dashboard and generate App ID and Secret Key. Learn how to generate API keys.
Ensure you have whitelisted your website domain for integration. Read more about Domain Whitelisting.
The web checkout integration consists of three essential steps:
Creating an order.
Opening the checkout page.
Confirming the payment.
The step-by-step guide for each step of the integration process is as follows:
​
Step 1: Creating an order
To integrate the Cashfree Payment Gateway, the first step is to create an order. This must be done before any payment processing can occur. Set up an endpoint on your server to handle order creation as you cannot call this API from client side.
Order creation must be done through your backend, as this API requires your secret key. It should not be called directly from the client-side.
API request for creating an order
Here’s a sample request for creating an order using your desired backend language. Cashfree offers backend SDKs to simplify the integration process.

javascript

python

java

go

csharp

php

curl

Copy

Ask AI
import { Cashfree, CFEnvironment } from "cashfree-pg";

const cashfree = new Cashfree(
	CFEnvironment.PRODUCTION,
	"{Client ID}",
	"{Client Secret Key}"
);

function createOrder() {
	var request = {
		order_amount: "1",
		order_currency: "INR",
		customer_details: {
			customer_id: "node_sdk_test",
			customer_name: "",
			customer_email: "example@gmail.com",
			customer_phone: "9999999999",
		},
		order_meta: {
			return_url:
				"https://test.cashfree.com/pgappsdemos/return.php?order_id=order_123",
		},
		order_note: "",
	};

	cashfree
		.PGCreateOrder(request)
		.then((response) => {
			var a = response.data;
			console.log(a);
		})
		.catch((error) => {
			console.error("Error setting up order request:", error.response.data);
		});
}
After successfully creating an order, you will receive a unique order_id and payment_session_id that you need for subsequent steps.
You can view all the complete API request and response for /orders here.
​
Step 2: Opening the checkout page
This step requires you to whitelist your domain with Cashfree.
​
1. Include JS SDK in your client code
To integrate the Cashfree checkout, you must include our JavaScript SDK within your JS file.

CDN

NPM

Copy

Ask AI
npm install @cashfreepayments/cashfree-js
​
2. Initialise the SDK
You need to initialise the variable using the Cashfree() function.
There are two modes applicable for this: sandbox or production.
Sandbox is used for a test environment, whereas production is used for production mode.

CDN

NPM

Copy

Ask AI
const cashfree = await load({
	mode: "sandbox" //or production
});
//This load function returns a Promise that resolves with a newly created Cashfree object once Cashfree.js has loaded. If you call load in a server environment it will resolve to null.
​
3. Open Cashfree checkout
To open the checkout, you can use the cashfree.checkout() method. This method can take in the following parameters :
paymentSessionId: Received from Create Order response.
redirectTarget (optional): This parameter decides how the payment page will open up.You can provide the following values:
Property Value	Description
_self(default)	Opens the payment link in the same frame as it was clicked.
_blank	Opens the payment link in a new window or tab.
_top	Opens the linked document in the full body of the window.
_modal	Opens the payment link in a pop-up window on the current page.
DOM element	Opens the payment link directly within a specified DOM element.
Checkout Variants
Redirect checkout : For redirectTarget _self, _blank, _top
Popup checkout: For redirectTarget _modal
Inline checkout: For redirectTarget DOM element
When using pop-up and inline checkout, the approach varies slightly. You need to manage the promise returned by cashfree.checkout() to execute any additional code following the payment attempt.

Redirect - javascript

Redirect - React

Popup - JavaScript

Popup - React

Inline - Javascript

Inline - React

Copy

Ask AI
import { load } from "@cashfreepayments/cashfree-js";

function Checkout() {
  let cashfree;
  var initializeSDK = async function () {
    cashfree = await load({
      mode: "production",
    });
  };
  initializeSDK();

  const doPayment = async () => {
    let checkoutOptions = {
      paymentSessionId: "your-payment-session-id",
      redirectTarget: "_self",
    };
    cashfree.checkout(checkoutOptions);
  };

  return (
    <div class="row">
      <p>Click below to open the checkout page in the current tab</p>
      <button type="submit" class="btn btn-primary" id="renderBtn" onClick={doPayment}>
        Pay Now
      </button>
    </div>
  );
}
export default Checkout;
​
Step 3: Confirming the payment
Once the payment is completed, you need to confirm whether the payment was successful by checking the order status.
Redirect checkout
Once the payment process finishes, the user will be redirected to the return URL you provided during order creation (Step 1). If no return URL is provided, customers will be redirected to Cashfree’s default page.
We recommend that you provide a return URL while creating an order. This will improve the overall user experience by ensuring your customers don’t land on broken or duplicated pages. Also, remember to add context of the order in your return URL so that you can identify the order once the customer has returned to this URL.
Popup and inline checkout
Once the payment process finishes, the cashfree.checkout() function returns a promise which should be handled by the merchant.
​
Order status verification
To verify an order you can call our /pg/orders endpoint from your backend. You can also use our SDK to achieve the same.

golang

javascript

php

java

python

csharp

curl

Copy

Ask AI
cashfree
	.PGFetchOrder("<order_id>")
	.then((response) => {
		console.log("Order fetched successfully:", response.data);
	})
	.catch((error) => {
		console.error("Error:", error.response.data.message);
	});
Before delivering services to the customer, always verify the status of the order, which can be done using the Get Order API. An order is considered successful when the order_status is PAID.
​
Testing
You should now have a working checkout button that opens the Cashfree-hosted payment page. If your integration isn’t working, try the following steps:
Open the Network tab in your browser’s developer tools.
Click the button and check the console logs.
Ensure that the correct environment and payment session ID are being passed.
Use console.log() inside your button click listener to confirm whether the data is being passed correctly or not.
​
💻 Quick dev-to-dev talk
You clearly care about building better payment experiences for your clients, here’s a quick tip: Earn additional income doing exactly what you’re doing now!Join the Cashfree Affiliate Partner Program and get rewarded every time your clients use Cashfree.What’s in it for you?
Earn up to 0.25% commission on every transaction
Be more than a dev - be the trusted fintech partner for your clients
Get a dedicated partner manager, your go-to expert
What’s in it for your clients?
Instant activation, go live in minutes.
Industry-best success rate across all payment modes.
Effortlessly accept international payments in 140+ currencies
Ready to push to prod? 👉 Become a Partner now
Was this page helpful?


Yes

No
Dashboard
Custom Checkout Integration - Android
Ask a question...

github
youtube
website
Powered by Mintlify
Cashfree Hosted Checkout
Abandoned Checkout Webhook

Open in ChatGPT

Cashfree One Click Checkout (OCC) webhooks notify business service providers (BSPs) in real time when customers create abandoned carts. BSPs can add their webhook URLs to receive these events.
If a customer drops off during checkout and provides a phone number or email address, Cashfree OCC creates an abandoned cart record in both Shopify and the Cashfree system. Merchants can use this data to retarget users.
Abandoned cart records include:
Customer details: Phone number, email address, or both
Address details: Pincode, state, and other information. The address is included only if the customer submits the complete address.
Cart details: Always included
OCC URL: Link to the merchant’s Shopify store with the OCC page preloaded
Cashfree OCC triggers webhooks only for abandoned carts, not for completed checkouts. Once a BSP adds a webhook URL, it begins receiving events. To enable this, merchants must ask the BSP to share the webhook URL where Cashfree should send data.
Cashfree doesn’t send abandoned checkouts to Shopify if a login is required in the native checkout settings.
​
Adding a webhook endpoint
To start receiving abandoned cart webhooks from Cashfree One Click Checkout (OCC), follow these steps:
Log in to the Merchant Dashboard.
Go to Payment Gateway > Developers > Webhooks > Configuration > Payment Gateway tab.
On the Webhooks page, click Add Webhook Endpoints.
In the Endpoint Details section:
Enter the endpoint URL where you want to receive webhook data.
Click Test to verify the URL.
From the drop-down menu, select Webhook Version: 2025-01-01.
Click Continue.
In the Add Policy section:
Choose a retry policy. The default policy includes 3 retries.
Select the relevant events to subscribe to.
Optionally, add another retry policy if needed.
Click Continue.
In the Summary section:
Review the configuration.
Click Update Secret Key, then click Update in the confirmation pop-up.
Click Save.

​
Sample webhook event payload
Below is a sample webhook event payload for an abandoned cart.
Use the signature to verify that the request has not been tampered with. To verify the signature, use your merchant secret key along with the payload.

Copy

Ask AI
{
  "cartId": 75355,
  "storeUrl": "test-mihir-1.myshopify.com",
  "platform": null,
  "cartToken": "Z2NwLWFzaWEtc291dGhlYXN0MTowMUpXRVgyWlJQSFpRRk42SDBCRkFaME1XMA?key=2fee923b8bebe7ecccfad7afd75e7a34",
  "email": "darpxxxxx[at]xxxx[dot]xom",
  "phone": "+91 6000376569",
  "abandonedCheckoutUrl": "https://sandbox.cashfree.com/pg/view/sessions/checkout/web/g63eHoiIayRccLzTvGPX",
  "originalTotalPrice": 2000.0,
  "totalPrice": 1800.0,
  "totalDiscount": 200.0,
  "utmParameters": {
    "fbclid": "",
    "utm_campaign": "",
    "utm_medium": "",
    "utm_content": "",
    "utm_source": ""
  },
  "lineItems": [
    {
      "reference": 8181897822385,
      "variantId": 45515259445425,
      "skuName": "",
      "name": "Jordans - Black",
      "description": "",
      "detailsUrlStr": "",
      "imageUrlStr": "https://cdn.shopify.com/s/files/1/0628/9037/7393/files/1.webp?v=1732785645",
      "imageS3UrlStr": "https://cashfree-checkoutcartimages-gamma.cashfree.com/2193502202/checkoutcartitem1",
      "originalPrice": 500.0,
      "discountedPrice": 400.0,
      "currency": "INR",
      "quantity": 2,
      "discounts": [
        {
          "title": "SHOE_AUTOMATIC",
          "description": "",
          "type": "FIXED",
          "value": 200
        }
      ]
    },
    {
      "reference": 8352793428145,
      "variantId": 45538243870897,
      "skuName": "",
      "name": "bundle 2 - Black / L / Mock",
      "description": "",
      "detailsUrlStr": "",
      "imageUrlStr": "",
      "imageS3UrlStr": "https://cashfree-checkoutcartimages-gamma.cashfree.com/2193502202/checkoutcartitem2",
      "originalPrice": 1000.0,
      "discountedPrice": 1000.0,
      "currency": "INR",
      "quantity": 1,
      "discounts": []
    }
  ],
  "promotions": [
    {
      "code": "SHOE_AUTOMATIC",
      "value": 200
    }
  ],
  "customer": {
    "email": "darpxxxxx[at]xxxx[dot]xom",
    "firstName": "Darpan",
    "lastName": "Deka",
    "shippingAddress": {
      "customerName": "Darpan Deka",
      "address1": "Rangia, Murara",
      "address2": "",
      "city": "Rangia",
      "province": "Assam",
      "country": "India",
      "zip": "781354",
      "email": "XXXXXXXXXXXXXXXXXXXX",
      "phone": "XXXXXXXXXXXXXXXXXXXX",
      "name": null,
      "provinceCode": "AS",
      "countryCode": "IN"
    }
  }
}
​
Webhook headers
Each webhook request contains the following headers for validation and tracing:
Header Key	Description
x-datadog-sampling-priority	Indicates trace sampling priority. A value of 1 means the trace is retained.
x-datadog-parent-id	ID of the parent span in a distributed trace.
x-datadog-trace-id	Unique ID for the trace across services.
content-length	Size of the request body in bytes.
x-webhook-attempt	Number of delivery attempts.
content-type	MIME type of the request body (application/json).
x-webhook-signature	Cryptographic signature for payload integrity.
x-idempotency-key	Unique key to prevent duplicate processing.
x-webhook-timestamp	Unix timestamp (in milliseconds) indicating when the webhook was sent.
x-webhook-version	Version of the webhook payload (e.g., 2025-01-01).
accept	Acceptable media types in the response (*/*).
host	Receiving server domain (e.g., webhook.site).
user-agent	Client software sending the request (e.g., ReactorNetty/1.1.11).

Add to assistant
Was this page helpful?


Yes

No


Skip to main content
Cashfree Payments Developer Documentation home pagelight logo

Search or ask...
Ctrl K
Discord
Create Account

Payments
Payouts
Secure ID
Partners and Platforms
API Reference
AI and Tools
Help Center
Payments API
Get Started
Payment SDK
API Limits
Enums
Best Practices
Errors
v2025-01-01
Overview

Orders

Payments

Payment Links

Refunds

Customers

Easy-Split

Payment Methods

Offers

Token Vault

Disputes

Settlements

softPOS

Simulation

Subscription

VBA

International Payments

Utilities
Other Versions

v2023-08-01
End Points
Release Notes

Orders
POST
Create Order
GET
Get Order
PATCH
Terminate Order
GET
Get Order Extended
PUT
Update Order Extended

Payments
POST
Submit or Resend OTP
POST
Order Pay
POST
Preauthorization
GET
Get Payments for an Order
GET
Get Payment by ID
Payment Webhooks

Payment Links
POST
Create Payment Link
GET
Get Orders for a Payment Link
POST
Cancel Payment Link
GET
Fetch Payment Link Details
Webhooks

Refunds

Customers
POST
Create Customer

Easy-Split

Eligibility

Offers
POST
Create Offer
GET
Get Offer by ID

Dispute
GET
Get Disputes by Dispute ID
GET
Get Disputes by Order Id
GET
Get Disputes by Payment ID
POST
Submit Evidence to contest the Dispute by Dispute ID
PUT
Accept Dispute by Dispute ID
Dispute Webhooks

Settlements
POST
Get All Settlements
GET
Get Settlements by Order ID
POST
Mark Order For Settlement
POST
PG Reconciliation
POST
Settlement Reconciliation
Settlement Webhooks

Partners
POST
Create Pre-Activated Vpas for partner
GET
Get Pre-Activated Vpas for partner

Token Vault

softPOS

Simulation

Subscription

VBA

International Payments

v2022-01-01



Copy

Ask AI
curl --request POST \
  --url https://sandbox.cashfree.com/pg/orders \
  --header 'Content-Type: application/json' \
  --header 'x-api-version: <x-api-version>' \
  --header 'x-client-id: <api-key>' \
  --header 'x-client-secret: <api-key>' \
  --data '{
  "order_currency": "INR",
  "order_amount": 10.34,
  "customer_details": {
    "customer_id": "7112AAA812234",
    "customer_phone": "9898989898"
  }
}'

200

400

401

404

409

422

429

500

Copy

Ask AI
{
  "cf_order_id": "2149460581",
  "created_at": "2023-08-11T18:02:46+05:30",
  "customer_details": {
    "customer_id": "409128494",
    "customer_name": "Johmn Doe",
    "customer_email": "pmlpayme@ntsas.com",
    "customer_phone": "9876543210",
    "customer_uid": "54deabb4-ba45-4a60-9e6a-9c016fe7ab10"
  },
  "entity": "order",
  "order_amount": 22,
  "payment_session_id": "session_a1VXIPJo8kh7IBigVXX8LgTMupQW_cu25FS8KwLwQLOmiHqbBxq5UhEilrhbDSKKHA6UAuOj9506aaHNlFAHEqYrHSEl9AVtYQN9LIIc4vkH",
  "order_currency": "INR",
  "order_expiry_time": "2023-09-09T18:02:46+05:30",
  "order_id": "order_3242Tq4Edj9CC5RDcMeobmJOWOBJij",
  "order_meta": {
    "return_url": "https://www.cashfree.com/devstudio/thankyou",
    "payment_methods": "cc",
    "notify_url": "https://example.com/cf_notify"
  },
  "order_note": "some order note LIST",
  "order_splits": [],
  "order_status": "ACTIVE",
  "order_tags": {
    "name": "John",
    "age": "19"
  },
  "terminal_data": null,
  "cart_details": {
    "cart_id": "1"
  }
}
Orders
Create Order

Open in ChatGPT

Order
An order is an entity which has a amount and currency associated with it. It is something for which you want to collect payment for. Use this API to create orders with Cashfree from your backend to get a payment_sessions_id. You can use the payment_sessions_id to create a transaction for the order.

POST

https://sandbox.cashfree.com/pg
/
orders

Try it
Authorizations

XClientID & XClientSecret
​
x-client-id
stringheaderrequired
Client app ID. You can find your app id in the Merchant Dashboard.

​
x-client-secret
stringheaderrequired
Client secret key. You can find your secret key in the Merchant Dashboard.

Headers
​
x-api-version
stringdefault:2023-08-01required
API version to be used. Format is in YYYY-MM-DD

​
x-request-id
string
Request id for the API call. Can be used to resolve tech issues. Communicate this in your tech related queries to cashfree

​
x-idempotency-key
string<UUID>
An idempotency key is a unique identifier you include with your API call.
If the request fails or times out, you can safely retry it using the same key to avoid duplicate actions.

Body
application/json
Request body to create an order at cashfree

​
order_amount
numberrequired
Bill amount for the order. Provide upto two decimals. 10.15 means Rs 10 and 15 paisa

Required range: x >= 1
Example:
10.15

​
order_currency
stringrequired
Currency for the order. INR if left empty. Fill out the Support Form to enable new currencies.

Example:
"INR"

​
customer_details
objectrequired
The customer details that are necessary. Note that you can pass dummy details if your use case does not require the customer details.

Show child attributes

Example:
{
  "customer_id": "7112AAA812234",
  "customer_email": "john@cashfree.com",
  "customer_phone": "9908734801",
  "customer_name": "John Doe",
  "customer_bank_account_number": "1518121112",
  "customer_bank_ifsc": "XITI0000001",
  "customer_bank_code": 3333,
  "customer_uid": "54deabb4-ba45-4a60-9e6a-9c016fe7ab10"
}
​
order_id
string
Order identifier present in your system. Alphanumeric, '_' and '-' only

Required string length: 3 - 45
Example:
"your-order-id"

​
cart_details
object
The cart details that are necessary like shipping address, billing address and more.

Show child attributes

​
terminal
object
Use this if you are creating an order for cashfree's softPOS

Show child attributes

Example:
{
  "terminal_phone_no": "6309291183",
  "terminal_id": "terminal-123",
  "terminal_type": "SPOS",
  "added_on": "2023-08-04T13:12:58+05:30",
  "cf_terminal_id": 31051123,
  "last_updated_on": "2023-09-06T14:07:00+05:30",
  "terminal_address": "Banglore",
  "terminal_name": "test",
  "terminal_note": "POS vertical",
  "terminal_status": "ACTIVE"
}
​
order_meta
object
Optional meta details to control how the customer pays and how payment journey completes

Show child attributes

Example:
{
  "return_url": "https://www.cashfree.com/devstudio/thankyou",
  "payment_methods": "cc,dc"
}
​
order_expiry_time
string<ISO8601>
Time after which the order expires. Customers will not be able to make the payment beyond the time specified here. We store timestamps in IST, but you can provide them in a valid ISO 8601 time format. Example 2021-07-02T10:20:12+05:30 for IST, 2021-07-02T10:20:12Z for UTC

Example:
"2021-07-02T10:20:12+05:30"

​
order_note
string
Order note for reference.

Required string length: 3 - 200
Example:
"Test order"

​
order_tags
object
Custom Tags in thr form of {"key":"value"} which can be passed for an order. A maximum of 10 tags can be added

Show child attributes

Example:
{
  "name": "John Doe",
  "city": "Bangalore",
  "product": "Laptop",
  "shipping_address": "123 Main St"
}
​
order_splits
VendorSplit · object[]
If you have Easy split enabled in your Cashfree account then you can use this option to split the order amount.

Show child attributes

Example:
[{ "amount": 10, "vendor": "john" }]
Response

200

application/json
OK

The complete order entity

​
cf_order_id
string
unique id generated by cashfree for your order

​
order_id
string
order_id sent during the api request

​
entity
string
Type of the entity.

​
order_currency
string
Currency of the order. Example INR

​
order_amount
number
​
order_status
string
Possible values are

ACTIVE: Order does not have a sucessful transaction yet
PAID: Order is PAID with one successful transaction
EXPIRED: Order was not PAID and not it has expired. No transaction can be initiated for an EXPIRED order. TERMINATED: Order terminated TERMINATION_REQUESTED: Order termination requested
​
payment_session_id
string
​
order_expiry_time
string<date-time>
​
order_note
string
Additional note for order

​
created_at
string<date-time>
When the order was created at cashfree's server

Example:
"2022-08-16T14:45:38+05:30"

​
order_splits
VendorSplit · object[]
Show child attributes

​
customer_details
object
The customer details that are necessary. Note that you can pass dummy details if your use case does not require the customer details.

Show child attributes

Example:
{
  "customer_id": "7112AAA812234",
  "customer_email": "john@cashfree.com",
  "customer_phone": "9908734801",
  "customer_name": "John Doe",
  "customer_bank_account_number": "1518121112",
  "customer_bank_ifsc": "XITI0000001",
  "customer_bank_code": 3333,
  "customer_uid": "54deabb4-ba45-4a60-9e6a-9c016fe7ab10"
}
​
order_meta
object
Optional meta details to control how the customer pays and how payment journey completes

Show child attributes

​
order_tags
object
Custom Tags in thr form of {"key":"value"} which can be passed for an order. A maximum of 10 tags can be added

Show child attributes

Example:
{
  "product": "Laptop",
  "shipping_address": "123 Main St"
}
​
cart_details
object
Cart Details in the Order Entity Response

Show child attributes

Was this page helpful?


Yes

No
Release Notes
Get Order
Ask a question...

github
youtube
website
Powered by Mintlify
Skip to main content
Cashfree Payments Developer Documentation home pagelight logo

Search or ask...
Ctrl K
Discord
Create Account

Payments
Payouts
Secure ID
Partners and Platforms
API Reference
AI and Tools
Help Center
Payments API
Get Started
Payment SDK
API Limits
Enums
Best Practices
Errors
v2025-01-01
Overview

Orders

Payments

Payment Links

Refunds

Customers

Easy-Split

Payment Methods

Offers

Token Vault

Disputes

Settlements

softPOS

Simulation

Subscription

VBA

International Payments

Utilities
Other Versions

v2023-08-01
End Points
Release Notes

Orders
POST
Create Order
GET
Get Order
PATCH
Terminate Order
GET
Get Order Extended
PUT
Update Order Extended

Payments
POST
Submit or Resend OTP
POST
Order Pay
POST
Preauthorization
GET
Get Payments for an Order
GET
Get Payment by ID
Payment Webhooks

Payment Links
POST
Create Payment Link
GET
Get Orders for a Payment Link
POST
Cancel Payment Link
GET
Fetch Payment Link Details
Webhooks

Refunds

Customers
POST
Create Customer

Easy-Split

Eligibility

Offers
POST
Create Offer
GET
Get Offer by ID

Dispute
GET
Get Disputes by Dispute ID
GET
Get Disputes by Order Id
GET
Get Disputes by Payment ID
POST
Submit Evidence to contest the Dispute by Dispute ID
PUT
Accept Dispute by Dispute ID
Dispute Webhooks

Settlements
POST
Get All Settlements
GET
Get Settlements by Order ID
POST
Mark Order For Settlement
POST
PG Reconciliation
POST
Settlement Reconciliation
Settlement Webhooks

Partners
POST
Create Pre-Activated Vpas for partner
GET
Get Pre-Activated Vpas for partner

Token Vault

softPOS

Simulation

Subscription

VBA

International Payments

v2022-01-01



Copy

Ask AI
curl --request POST \
  --url https://sandbox.cashfree.com/pg/orders \
  --header 'Content-Type: application/json' \
  --header 'x-api-version: <x-api-version>' \
  --header 'x-client-id: <api-key>' \
  --header 'x-client-secret: <api-key>' \
  --data '{
  "order_currency": "INR",
  "order_amount": 10.34,
  "customer_details": {
    "customer_id": "7112AAA812234",
    "customer_phone": "9898989898"
  }
}'

200

400

401

404

409

422

429

500

Copy

Ask AI
{
  "cf_order_id": "2149460581",
  "created_at": "2023-08-11T18:02:46+05:30",
  "customer_details": {
    "customer_id": "409128494",
    "customer_name": "Johmn Doe",
    "customer_email": "pmlpayme@ntsas.com",
    "customer_phone": "9876543210",
    "customer_uid": "54deabb4-ba45-4a60-9e6a-9c016fe7ab10"
  },
  "entity": "order",
  "order_amount": 22,
  "payment_session_id": "session_a1VXIPJo8kh7IBigVXX8LgTMupQW_cu25FS8KwLwQLOmiHqbBxq5UhEilrhbDSKKHA6UAuOj9506aaHNlFAHEqYrHSEl9AVtYQN9LIIc4vkH",
  "order_currency": "INR",
  "order_expiry_time": "2023-09-09T18:02:46+05:30",
  "order_id": "order_3242Tq4Edj9CC5RDcMeobmJOWOBJij",
  "order_meta": {
    "return_url": "https://www.cashfree.com/devstudio/thankyou",
    "payment_methods": "cc",
    "notify_url": "https://example.com/cf_notify"
  },
  "order_note": "some order note LIST",
  "order_splits": [],
  "order_status": "ACTIVE",
  "order_tags": {
    "name": "John",
    "age": "19"
  },
  "terminal_data": null,
  "cart_details": {
    "cart_id": "1"
  }
}
Orders
Create Order

Open in ChatGPT

Order
An order is an entity which has a amount and currency associated with it. It is something for which you want to collect payment for. Use this API to create orders with Cashfree from your backend to get a payment_sessions_id. You can use the payment_sessions_id to create a transaction for the order.

POST

https://sandbox.cashfree.com/pg
/
orders

Try it
Authorizations

XClientID & XClientSecret
​
x-client-id
stringheaderrequired
Client app ID. You can find your app id in the Merchant Dashboard.

​
x-client-secret
stringheaderrequired
Client secret key. You can find your secret key in the Merchant Dashboard.

Headers
​
x-api-version
stringdefault:2023-08-01required
API version to be used. Format is in YYYY-MM-DD

​
x-request-id
string
Request id for the API call. Can be used to resolve tech issues. Communicate this in your tech related queries to cashfree

​
x-idempotency-key
string<UUID>
An idempotency key is a unique identifier you include with your API call.
If the request fails or times out, you can safely retry it using the same key to avoid duplicate actions.

Body
application/json
Request body to create an order at cashfree

​
order_amount
numberrequired
Bill amount for the order. Provide upto two decimals. 10.15 means Rs 10 and 15 paisa

Required range: x >= 1
Example:
10.15

​
order_currency
stringrequired
Currency for the order. INR if left empty. Fill out the Support Form to enable new currencies.

Example:
"INR"

​
customer_details
objectrequired
The customer details that are necessary. Note that you can pass dummy details if your use case does not require the customer details.

Show child attributes

Example:
{
  "customer_id": "7112AAA812234",
  "customer_email": "john@cashfree.com",
  "customer_phone": "9908734801",
  "customer_name": "John Doe",
  "customer_bank_account_number": "1518121112",
  "customer_bank_ifsc": "XITI0000001",
  "customer_bank_code": 3333,
  "customer_uid": "54deabb4-ba45-4a60-9e6a-9c016fe7ab10"
}
​
order_id
string
Order identifier present in your system. Alphanumeric, '_' and '-' only

Required string length: 3 - 45
Example:
"your-order-id"

​
cart_details
object
The cart details that are necessary like shipping address, billing address and more.

Show child attributes

​
terminal
object
Use this if you are creating an order for cashfree's softPOS

Show child attributes

Example:
{
  "terminal_phone_no": "6309291183",
  "terminal_id": "terminal-123",
  "terminal_type": "SPOS",
  "added_on": "2023-08-04T13:12:58+05:30",
  "cf_terminal_id": 31051123,
  "last_updated_on": "2023-09-06T14:07:00+05:30",
  "terminal_address": "Banglore",
  "terminal_name": "test",
  "terminal_note": "POS vertical",
  "terminal_status": "ACTIVE"
}
​
order_meta
object
Optional meta details to control how the customer pays and how payment journey completes

Show child attributes

Example:
{
  "return_url": "https://www.cashfree.com/devstudio/thankyou",
  "payment_methods": "cc,dc"
}
​
order_expiry_time
string<ISO8601>
Time after which the order expires. Customers will not be able to make the payment beyond the time specified here. We store timestamps in IST, but you can provide them in a valid ISO 8601 time format. Example 2021-07-02T10:20:12+05:30 for IST, 2021-07-02T10:20:12Z for UTC

Example:
"2021-07-02T10:20:12+05:30"

​
order_note
string
Order note for reference.

Required string length: 3 - 200
Example:
"Test order"

​
order_tags
object
Custom Tags in thr form of {"key":"value"} which can be passed for an order. A maximum of 10 tags can be added

Show child attributes

Example:
{
  "name": "John Doe",
  "city": "Bangalore",
  "product": "Laptop",
  "shipping_address": "123 Main St"
}
​
order_splits
VendorSplit · object[]
If you have Easy split enabled in your Cashfree account then you can use this option to split the order amount.

Show child attributes

Example:
[{ "amount": 10, "vendor": "john" }]
Response

200

application/json
OK

The complete order entity

​
cf_order_id
string
unique id generated by cashfree for your order

​
order_id
string
order_id sent during the api request

​
entity
string
Type of the entity.

​
order_currency
string
Currency of the order. Example INR

​
order_amount
number
​
order_status
string
Possible values are

ACTIVE: Order does not have a sucessful transaction yet
PAID: Order is PAID with one successful transaction
EXPIRED: Order was not PAID and not it has expired. No transaction can be initiated for an EXPIRED order. TERMINATED: Order terminated TERMINATION_REQUESTED: Order termination requested
​
payment_session_id
string
​
order_expiry_time
string<date-time>
​
order_note
string
Additional note for order

​
created_at
string<date-time>
When the order was created at cashfree's server

Example:
"2022-08-16T14:45:38+05:30"

​
order_splits
VendorSplit · object[]
Show child attributes

​
customer_details
object
The customer details that are necessary. Note that you can pass dummy details if your use case does not require the customer details.

Show child attributes

Example:
{
  "customer_id": "7112AAA812234",
  "customer_email": "john@cashfree.com",
  "customer_phone": "9908734801",
  "customer_name": "John Doe",
  "customer_bank_account_number": "1518121112",
  "customer_bank_ifsc": "XITI0000001",
  "customer_bank_code": 3333,
  "customer_uid": "54deabb4-ba45-4a60-9e6a-9c016fe7ab10"
}
​
order_meta
object
Optional meta details to control how the customer pays and how payment journey completes

Show child attributes

​
order_tags
object
Custom Tags in thr form of {"key":"value"} which can be passed for an order. A maximum of 10 tags can be added

Show child attributes

Example:
{
  "product": "Laptop",
  "shipping_address": "123 Main St"
}
​
cart_details
object
Cart Details in the Order Entity Response

Show child attributes

Was this page helpful?


Yes

No
Release Notes
Get Order
Ask a question...

github
youtube
website
Powered by Mintlify
# Create Order

> ### Order
An order is an entity which has a amount and currency associated with it. It is something for which you want to collect payment for.
Use this API to create orders with Cashfree from your backend to get a `payment_sessions_id`. 
You can use the `payment_sessions_id` to create a transaction for the order.


## OpenAPI

````yaml openapi/payments/v2023-08-01.yaml post /orders
paths:
  path: /orders
  method: post
  servers:
    - url: https://sandbox.cashfree.com/pg
      description: Sandbox server
    - url: https://api.cashfree.com/pg
      description: Production server
  request:
    security:
      - title: XClientID & XClientSecret
        parameters:
          query: {}
          header:
            x-client-id:
              type: apiKey
              description: >-
                Client app ID. You can find your app id in the [Merchant
                Dashboard](https://merchant.cashfree.com/auth/login/pg/developers/api-keys?env=prod).
            x-client-secret:
              type: apiKey
              description: >-
                Client secret key. You can find your secret key in the [Merchant
                Dashboard](https://merchant.cashfree.com/auth/login/pg/developers/api-keys?env=prod).
          cookie: {}
      - title: XClientID & XPartnerAPIKey
        parameters:
          query: {}
          header:
            x-client-id:
              type: apiKey
              description: >-
                Client app ID. You can find your app id in the [Merchant
                Dashboard](https://merchant.cashfree.com/auth/login/pg/developers/api-keys?env=prod).
            x-partner-apikey:
              type: apiKey
              description: >-
                If you are partner and you are making an api call on behalf of a
                merchant
          cookie: {}
      - title: XClientID & XClientSignatureHeader
        parameters:
          query: {}
          header:
            x-client-id:
              type: apiKey
              description: >-
                Client app ID. You can find your app id in the [Merchant
                Dashboard](https://merchant.cashfree.com/auth/login/pg/developers/api-keys?env=prod).
            x-client-signature:
              type: apiKey
              description: >-
                Use this if you do not want to pass the secret key and instead
                want to use signature
          cookie: {}
      - title: XPartnerMerchantID & XPartnerAPIKey
        parameters:
          query: {}
          header:
            x-partner-merchantid:
              type: apiKey
              description: >-
                If you are partner use this to specify the merchant id if you
                don't have the merchant client app id
            x-partner-apikey:
              type: apiKey
              description: >-
                If you are partner and you are making an api call on behalf of a
                merchant
          cookie: {}
    parameters:
      path: {}
      query: {}
      header:
        x-api-version:
          schema:
            - type: string
              required: true
              description: API version to be used. Format is in YYYY-MM-DD
              default: '2023-08-01'
        x-request-id:
          schema:
            - type: string
              required: false
              description: >-
                Request id for the API call. Can be used to resolve tech issues.
                Communicate this in your tech related queries to cashfree
        x-idempotency-key:
          schema:
            - type: string
              required: false
              description: >
                An idempotency key is a unique identifier you include with your
                API call.

                If the request fails or times out, you can safely retry it using
                the same key to avoid duplicate actions.
              format: UUID
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              order_id:
                allOf:
                  - type: string
                    description: >-
                      Order identifier present in your system. Alphanumeric, '_'
                      and '-' only
                    minLength: 3
                    maxLength: 45
                    example: your-order-id
              order_amount:
                allOf:
                  - type: number
                    description: >-
                      Bill amount for the order. Provide upto two decimals.
                      10.15 means Rs 10 and 15 paisa
                    format: double
                    example: 10.15
                    minimum: 1
              order_currency:
                allOf:
                  - type: string
                    description: >-
                      Currency for the order. INR if left empty. Fill out the
                      [Support
                      Form](https://merchant.cashfree.com/merchants/landing?env=prod&raise_issue=1)
                      to enable new currencies.
                    example: INR
              cart_details:
                allOf:
                  - allOf:
                      - $ref: '#/components/schemas/CartDetails'
              customer_details:
                allOf:
                  - allOf:
                      - $ref: '#/components/schemas/CustomerDetails'
                    example:
                      customer_id: 7112AAA812234
                      customer_email: john@cashfree.com
                      customer_phone: '9908734801'
              terminal:
                allOf:
                  - allOf:
                      - $ref: '#/components/schemas/TerminalDetails'
                    example:
                      terminal_phone_no: '6309291183'
                      terminal_id: terminal-1212
                      terminal_type: SPOS
              order_meta:
                allOf:
                  - allOf:
                      - $ref: '#/components/schemas/OrderMeta'
                    example:
                      return_url: https://www.cashfree.com/devstudio/thankyou
                      payment_methods: cc,dc
              order_expiry_time:
                allOf:
                  - type: string
                    format: ISO8601
                    description: >-
                      Time after which the order expires. Customers will not be
                      able to make the payment beyond the time specified here.
                      We store timestamps in IST, but you can provide them in a
                      valid ISO 8601 time format. Example
                      2021-07-02T10:20:12+05:30 for IST, 2021-07-02T10:20:12Z
                      for UTC
                    example: '2021-07-02T10:20:12+05:30'
              order_note:
                allOf:
                  - type: string
                    description: Order note for reference.
                    example: Test order
                    minLength: 3
                    maxLength: 200
              order_tags:
                allOf:
                  - allOf:
                      - $ref: '#/components/schemas/OrderTags'
                    example:
                      name: John Doe
                      city: Bangalore
              order_splits:
                allOf:
                  - type: array
                    description: >-
                      If you have Easy split enabled in your Cashfree account
                      then you can use this option to split the order amount.
                    items:
                      $ref: '#/components/schemas/VendorSplit'
                    example:
                      - amount: 10
                        vendor: john
            required: true
            title: CreateOrderRequest
            description: Request body to create an order at cashfree
            refIdentifier: '#/components/schemas/CreateOrderRequest'
            requiredProperties:
              - order_amount
              - order_currency
              - customer_details
        examples:
          order_minimum:
            summary: Minimun required details
            description: Minimum set of parameters needed to create an order at cashfree
            value:
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
          order_orderid:
            summary: Specify your order_id
            description: >-
              You should always send `order_id`. If not sent Cashfree will
              generate one for you. This is useful during other api calls
            value:
              order_id: playstation_purchase_1
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9908734801'
          order_customer:
            summary: Customer Details
            description: Complete customer details
            value:
              order_id: playstation_purchase_1
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9908734801'
                customer_email: john@example.com
                customer_name: John Doe
          order_with_return_url:
            summary: With return/callback URL
            description: add a return url to your order
            value:
              order_id: playstation_purchase_2
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
              order_meta:
                return_url: https://www.cashfree.com/devstudio/thankyou
          order_with_payment_methods:
            summary: With Payment Methods URL
            description: >-
              add payment methods, customer can pnly pay using these payment
              methods only
            value:
              order_id: playstation_purchase_4
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
              order_meta:
                return_url: https://www.cashfree.com/devstudio/thankyou
                payment_methods: cc,dc,upi
          order_expiry:
            summary: With future expiry time for order
            description: >-
              Add an exipry time for your order. No transactions would be
              accepted after the order has expired
            value:
              order_id: playstation_purchase_5
              order_currency: INR
              order_amount: 10.34
              order_expiry_time: '2021-07-29T00:00:00.000Z'
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
          order_note:
            summary: With additonal note
            description: >-
              Add an additional note for your order which you can later use. It
              has to be string. For more detailed data use `order_tags`
            value:
              order_id: playstation_purchase_6
              order_currency: INR
              order_amount: 10.34
              order_note: John buying playstation
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
          order_tags:
            summary: With order tags
            description: >-
              Add key value pairs to your order. Can be used later in your
              workflow
            value:
              order_id: playstation_purchase_6
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
              order_tags:
                address: Bengaluru, India
                pincode: '560034'
          order_splits_amount:
            summary: With order split Amount
            description: >-
              Create an order where the amount received will be split between
              vendor and merchant based on absolute amount.
            value:
              order_id: playstation_purchase_8
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
              order_splits:
                - vendor_id: Jane
                  amount: 1.45
                  tags:
                    address: Hyderabad
                - vendor_id: Barbie
                  amount: 3.45
                  tags:
                    address: Bengaluru, India
          order_splits_cent:
            summary: With order split Percentage
            description: >
              Create an order where the amount received will be split between
              vendors and merchant based on percentage.

              In the below example order amount, let us say INR 200 will be
              divided like this

              - 33% to merchant becomes INR 66 

              - 20% to Jane becomes INR 40

              - 47% to Barbie becomes INR 94
            value:
              order_id: playstation_purchase_8
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
              order_splits:
                - vendor_id: Jane
                  percentage: 20
                - vendor_id: Barbie
                  percentage: 47
          order_invoice:
            summary: With order invoice
            description: Add invoice details for your order
            value:
              order_id: playstation_purchase_6
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_phone: '9898989898'
              order_tags:
                gst: '1'
                gstin: 27AAFCN5072P1ZV
                invoice_date: '2023-06-20T04:35:16.748Z'
                invoice_number: inv1687149916474
                invoice_link: https://example.com/cf/nextgen.php#section-2
                invoice_name: Walters Invoice
                cgst: '1'
                sgst: '1'
                igst: '1'
                cess: '1'
                gst_incentive: '1'
                gst_percentage: '1'
                pincode: '560034'
                city_tier: TIER1
          order_customer_tpv:
            summary: Customer TPV
            description: >-
              Customer with bank details if provided he or she can pay by only
              that bank account
            value:
              order_id: playstation_purchase_1
              order_currency: INR
              order_amount: 10.34
              customer_details:
                customer_id: 7112AAA812234
                customer_name: John Doe
                customer_phone: '9908734801'
                customer_email: john@example.com
                customer_bank_ifsc: XDFC0000045
                customer_bank_account_number: '123124123123123'
                customer_bank_code: 3021
        description: Request body to create an order at cashfree
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              cf_order_id:
                allOf:
                  - type: string
                    description: unique id generated by cashfree for your order
              order_id:
                allOf:
                  - type: string
                    description: order_id sent during the api request
              entity:
                allOf:
                  - type: string
                    description: Type of the entity.
              order_currency:
                allOf:
                  - type: string
                    description: Currency of the order. Example INR
              order_amount:
                allOf:
                  - type: number
              order_status:
                allOf:
                  - type: string
                    description: >-
                      Possible values are 

                      - `ACTIVE`: Order does not have a sucessful transaction
                      yet

                      - `PAID`: Order is PAID with one successful transaction

                      - `EXPIRED`: Order was not PAID and not it has expired. No
                      transaction can be initiated for an EXPIRED order.

                      `TERMINATED`: Order terminated

                      `TERMINATION_REQUESTED`: Order termination requested
              payment_session_id:
                allOf:
                  - type: string
              order_expiry_time:
                allOf:
                  - type: string
                    format: date-time
              order_note:
                allOf:
                  - type: string
                    description: Additional note for order
              created_at:
                allOf:
                  - type: string
                    format: date-time
                    description: When the order was created at cashfree's server
                    example: '2022-08-16T14:45:38+05:30'
              order_splits:
                allOf:
                  - type: array
                    items:
                      $ref: '#/components/schemas/VendorSplit'
              customer_details:
                allOf:
                  - $ref: '#/components/schemas/CustomerDetailsResponse'
              order_meta:
                allOf:
                  - $ref: '#/components/schemas/OrderMeta'
              order_tags:
                allOf:
                  - $ref: '#/components/schemas/OrderTags'
              cart_details:
                allOf:
                  - $ref: '#/components/schemas/CartDetailsEntity'
            title: OrderEntity
            description: The complete order entity
            refIdentifier: '#/components/schemas/OrderEntity'
            example:
              $ref: '#/components/examples/order_entity_list_example/value/0'
        examples:
          example:
            value:
              cf_order_id: '2149460581'
              created_at: '2023-08-11T18:02:46+05:30'
              customer_details:
                customer_id: '409128494'
                customer_name: Johmn Doe
                customer_email: pmlpayme@ntsas.com
                customer_phone: '9876543210'
                customer_uid: 54deabb4-ba45-4a60-9e6a-9c016fe7ab10
              entity: order
              order_amount: 22
              payment_session_id: >-
                session_a1VXIPJo8kh7IBigVXX8LgTMupQW_cu25FS8KwLwQLOmiHqbBxq5UhEilrhbDSKKHA6UAuOj9506aaHNlFAHEqYrHSEl9AVtYQN9LIIc4vkH
              order_currency: INR
              order_expiry_time: '2023-09-09T18:02:46+05:30'
              order_id: order_3242Tq4Edj9CC5RDcMeobmJOWOBJij
              order_meta:
                return_url: https://www.cashfree.com/devstudio/thankyou
                payment_methods: cc
                notify_url: https://example.com/cf_notify
              order_note: some order note LIST
              order_splits: []
              order_status: ACTIVE
              order_tags:
                name: John
                age: '19'
              terminal_data: null
              cart_details:
                cart_id: '1'
        description: OK
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
              code:
                allOf:
                  - type: string
              type:
                allOf:
                  - type: string
                    enum:
                      - invalid_request_error
            title: BadRequestError
            description: Invalid request received from client
            refIdentifier: '#/components/schemas/BadRequestError'
            example:
              message: bad URL, please check API documentation
              code: request_failed
              type: invalid_request_error
        examples:
          example:
            value:
              message: bad URL, please check API documentation
              code: request_failed
              type: invalid_request_error
        description: Bad request error
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
              code:
                allOf:
                  - type: string
              type:
                allOf:
                  - type: string
                    description: authentication_error
            title: AuthenticationError
            description: Error if api keys are wrong
            refIdentifier: '#/components/schemas/AuthenticationError'
            example:
              message: authentication Failed
              code: request_failed
              type: authentication_error
        examples:
          example:
            value:
              message: authentication Failed
              code: request_failed
              type: authentication_error
        description: Authentication Error
    '404':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
              code:
                allOf:
                  - type: string
              type:
                allOf:
                  - type: string
                    enum:
                      - invalid_request_error
                    description: invalid_request_error
            title: ApiError404
            description: Error when resource requested is not found
            refIdentifier: '#/components/schemas/ApiError404'
            example:
              message: something is not found
              code: somethind_not_found
              type: invalid_request_error
        examples:
          example:
            value:
              message: something is not found
              code: somethind_not_found
              type: invalid_request_error
        description: Resource Not found
    '409':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
              code:
                allOf:
                  - type: string
              type:
                allOf:
                  - type: string
                    enum:
                      - invalid_request_error
                    description: invalid_request_error
            title: ApiError409
            description: duplicate request
            refIdentifier: '#/components/schemas/ApiError409'
            example:
              message: order with same id is already present
              code: order_already_exists
              type: invalid_request_error
        examples:
          example:
            value:
              message: order with same id is already present
              code: order_already_exists
              type: invalid_request_error
        description: Resource already present
    '422':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
              code:
                allOf:
                  - type: string
              type:
                allOf:
                  - type: string
                    enum:
                      - idempotency_error
                    description: idempotency_error
            title: IdempotencyError
            description: >-
              Error when idempotency fails. Different request body with the same
              idempotent key
            refIdentifier: '#/components/schemas/IdempotencyError'
            example:
              message: something is not found
              code: request_invalid
              type: idempotency_error
        examples:
          example:
            value:
              message: something is not found
              code: request_invalid
              type: idempotency_error
        description: Idempotency error
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
              code:
                allOf:
                  - type: string
              type:
                allOf:
                  - type: string
                    enum:
                      - rate_limit_error
                    description: rate_limit_error
            title: RateLimitError
            description: Error when rate limit is breached for your api
            refIdentifier: '#/components/schemas/RateLimitError'
            example:
              message: Too many requests from IP. Check headers
              code: request_failed
              type: rate_limit_error
        examples:
          example:
            value:
              message: Too many requests from IP. Check headers
              code: request_failed
              type: rate_limit_error
        description: Rate Limit Error
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              message:
                allOf:
                  - type: string
              code:
                allOf:
                  - type: string
              type:
                allOf:
                  - type: string
                    enum:
                      - api_error
                    description: api_error
            title: ApiError
            description: Error at cashfree's server
            refIdentifier: '#/components/schemas/ApiError'
            example:
              message: internal Server Error
              code: internal_error
              type: api_error
        examples:
          example:
            value:
              message: internal Server Error
              code: internal_error
              type: api_error
        description: API related Error
  deprecated: false
  type: path
components:
  schemas:
    CartDetails:
      title: CartDetails
      description: >-
        The cart details that are necessary like shipping address, billing
        address and more.
      type: object
      properties:
        shipping_charge:
          type: number
          format: double
        cart_name:
          type: string
          description: Name of the cart.
        cart_items:
          type: array
          items:
            $ref: '#/components/schemas/CartItem'
    CartItem:
      title: CartItem
      description: Each item in the cart.
      properties:
        item_id:
          type: string
          description: Unique identifier of the item
        item_name:
          type: string
          description: Name of the item
        item_description:
          type: string
          description: Description of the item
        item_tags:
          type: array
          items:
            type: string
          description: Tags attached to that item
        item_details_url:
          type: string
          description: Item details url
        item_image_url:
          type: string
          description: Item image url
        item_original_unit_price:
          type: number
          format: double
          description: Original price
        item_discounted_unit_price:
          type: number
          format: double
          description: Discounted Price
        item_currency:
          type: string
          description: Currency of the item.
        item_quantity:
          type: number
          format: int32
          description: Quantity if that item
    CustomerDetails:
      title: CustomerDetails
      description: >-
        The customer details that are necessary. Note that you can pass dummy
        details if your use case does not require the customer details.
      example:
        customer_id: 7112AAA812234
        customer_email: john@cashfree.com
        customer_phone: '9908734801'
        customer_name: John Doe
        customer_bank_account_number: '1518121112'
        customer_bank_ifsc: XITI0000001
        customer_bank_code: 3333
        customer_uid: 54deabb4-ba45-4a60-9e6a-9c016fe7ab10
      type: object
      properties:
        customer_id:
          type: string
          description: A unique identifier for the customer. Use alphanumeric values only.
          minLength: 3
          maxLength: 50
        customer_email:
          type: string
          description: Customer email address.
          minLength: 3
          maxLength: 100
        customer_phone:
          type: string
          description: >-
            Customer phone number. To accommodate international phone numbers,
            ensure the number is prefixed with a '+' to override the 10-digit
            limitation.
          minLength: 10
          maxLength: 10
        customer_name:
          type: string
          description: Name of the customer.
          minLength: 3
          maxLength: 100
        customer_bank_account_number:
          type: string
          description: >-
            Customer bank account. Required if you want to do a bank account
            check (TPV)
          minLength: 3
          maxLength: 20
        customer_bank_ifsc:
          type: string
          description: >-
            Customer bank IFSC. Required if you want to do a bank account check
            (TPV)
        customer_bank_code:
          type: number
          description: >-
            Customer bank code. Required for net banking payments, if you want
            to do a bank account check (TPV)
        customer_uid:
          type: string
          description: >-
            Customer identifier at Cashfree. You will get this when you
            create/get customer
      required:
        - customer_id
        - customer_phone
    CustomerDetailsResponse:
      title: CustomerDetailsResponse
      description: >-
        The customer details that are necessary. Note that you can pass dummy
        details if your use case does not require the customer details.
      example:
        customer_id: 7112AAA812234
        customer_email: john@cashfree.com
        customer_phone: '9908734801'
        customer_name: John Doe
        customer_bank_account_number: '1518121112'
        customer_bank_ifsc: XITI0000001
        customer_bank_code: 3333
        customer_uid: 54deabb4-ba45-4a60-9e6a-9c016fe7ab10
      type: object
      properties:
        customer_id:
          type: string
          description: A unique identifier for the customer. Use alphanumeric values only.
          minLength: 3
          maxLength: 50
        customer_email:
          type: string
          description: Customer email address.
          minLength: 3
          maxLength: 100
        customer_phone:
          type: string
          description: Customer phone number.
          minLength: 10
          maxLength: 10
        customer_name:
          type: string
          description: Name of the customer.
          minLength: 3
          maxLength: 100
        customer_bank_account_number:
          type: string
          description: >-
            Customer bank account. Required if you want to do a bank account
            check (TPV)
          minLength: 3
          maxLength: 20
        customer_bank_ifsc:
          type: string
          description: >-
            Customer bank IFSC. Required if you want to do a bank account check
            (TPV)
        customer_bank_code:
          type: number
          description: >-
            Customer bank code. Required for net banking payments, if you want
            to do a bank account check (TPV)
        customer_uid:
          type: string
          description: >-
            Customer identifier at Cashfree. You will get this when you
            create/get customer
    CartDetailsEntity:
      title: CartDetailsEntity
      description: Cart Details in the Order Entity Response
      type: object
      properties:
        cart_id:
          type: string
          description: ID of the cart that was created
    OrderMeta:
      title: OrderMeta
      description: >-
        Optional meta details to control how the customer pays and how payment
        journey completes
      type: object
      properties:
        return_url:
          type: string
          example: https://www.cashfree.com/devstudio/thankyou
          description: >-
            The URL to which user will be redirected to after the payment on
            bank OTP page. Maximum length: 250. We suggest to keep context of
            order_id in your return_url so that you can identify the order when
            customer lands on your page. Example of return_url format could be
            https://www.cashfree.com/devstudio/thankyou
        notify_url:
          type: string
          example: https://example.com/cf_notify
          description: >-
            Notification URL for server-server communication. Useful when user's
            connection drops while re-directing. NotifyUrl should be an https
            URL. Maximum length: 250.
        payment_methods:
          example: cc,dc,upi
          description: >-
            Allowed payment modes for this order. Pass comma-separated values
            among following options - "cc", "dc", "ccc",
            "ppc","nb","upi","paypal","app","paylater","cardlessemi","dcemi","ccemi","banktransfer".
            Leave it blank to show all available payment methods
    OrderTags:
      type: object
      maxProperties: 15
      description: >-
        Custom Tags in thr form of {"key":"value"} which can be passed for an
        order. A maximum of 10 tags can be added
      additionalProperties:
        type: string
        minLength: 1
        maxLength: 255
      example:
        product: Laptop
        shipping_address: 123 Main St
    TerminalDetails:
      description: Use this if you are creating an order for cashfree's softPOS
      example:
        added_on: '2023-08-04T13:12:58+05:30'
        cf_terminal_id: 31051123
        last_updated_on: '2023-09-06T14:07:00+05:30'
        terminal_address: Banglore
        terminal_id: terminal-123
        terminal_name: test
        terminal_note: POS vertical
        terminal_phone_no: '6309291183'
        terminal_status: ACTIVE
        terminal_type: SPOS
      properties:
        added_on:
          description: date time at which terminal is added
          type: string
        cf_terminal_id:
          description: >-
            cashfree terminal id,This is a required parameter when you do not
            provide the terminal phone number.
          type: number
          format: int64
        last_updated_on:
          description: last instant when this terminal was updated
          type: string
        terminal_address:
          description: location of terminal
          type: string
        terminal_id:
          description: terminal id for merchant reference
          maxLength: 100
          minLength: 3
          type: string
        terminal_name:
          description: name of terminal/agent/storefront
          type: string
        terminal_note:
          description: note given by merchant while creating the terminal
          type: string
        terminal_phone_no:
          description: >-
            mobile num of the terminal/agent/storefront,This is a required
            parameter when you do not provide the cf_terminal_id.
          type: string
        terminal_status:
          description: status of terminal active/inactive
          type: string
        terminal_type:
          description: >-
            To identify the type of terminal product in use, in this case it is
            SPOS.
          maxLength: 10
          minLength: 4
          type: string
      required:
        - terminal_type
      title: Terminal
      type: object
    VendorSplit:
      title: VendorSplit
      description: >-
        Use to split order when cashfree's Easy Split is enabled for your
        account.
      type: object
      example:
        vendor_id: Vendor01
        amount: 100.12
        description: order amount should be more than equal to 100.12
      properties:
        vendor_id:
          type: string
          description: Vendor id created in Cashfree system
        amount:
          type: number
          description: Amount which will be associated with this vendor
        percentage:
          type: number
          description: Percentage of order amount which shall get added to vendor account
        tags:
          type: object
          maxProperties: 15
          description: >-
            Custom Tags in thr form of {"key":"value"} which can be passed for
            an order. A maximum of 10 tags can be added
          additionalProperties:
            type: object
      required:
        - vendor_id

````

---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://www.cashfree.com/docs/llms.txt