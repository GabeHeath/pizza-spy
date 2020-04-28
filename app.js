// Sample of no current order: { orders: {}, query: { Phone: '5555555555' } }
// Sample of current order: {
//     "orders": {
//         "OrderStatus": {
//             "Version": "1.5",
//             "AsOfTime": "2020-04-24T16:13:43",
//             "StoreAsOfTime": "2020-04-24T16:15:21",
//             "StoreID": "4307",
//             "OrderID": "2020-04-24#448",
//             "Phone": "5555555555",
//             "ServiceMethod": "Carry-Out",
//             "AdvancedOrderTime": {},
//             "OrderDescription": "1 Large (14\") Thin Pizza w/ Pepperoni\n1 Large (14\") Thin Pizza w/ Black Olives\n",
//             "OrderTakeCompleteTime": "2020-04-24T16:13:43",
//             "TakeTimeSecs": "102",
//             "CsrID": "4260",
//             "CsrName": "Earl",
//             "OrderSourceCode": "Phone",
//             "OrderStatus": "Makeline",
//             "StartTime": "2020-04-24T16:13:43",
//             "MakeTimeSecs": "0",
//             "OvenTime": "2020-04-24T16:13:43",
//             "OvenTimeSecs": {},
//             "RackTime": {},
//             "RackTimeSecs": "0",
//             "RouteTime": {},
//             "DriverID": {},
//             "DriverName": {},
//             "OrderDeliveryTimeSecs": {},
//             "DeliveryTime": {},
//             "OrderKey": "430719448440",
//             "ManagerID": "0919",
//             "ManagerName": "William"
//         }
//     }, "query": {"Phone": "5555555555"}
// }

var pizzapi = require('dominos');
var nodemailer = require('nodemailer');
var schedule = require('node-schedule');
var contacts = require('./contacts');

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'x@x.com',
		pass: 'xxxxxxxxxxxxxxxxxx'
	}
});

var mailOptions = {
	from: 'x@x.com',
	to: 'x@x.com',
	subject: 'Pizza Spy: A Friend Has Ordered A Pizza',
	text: null
};

var contactIndex = 0;
var emailsSent = {};

var j = schedule.scheduleJob('*/1 * * * *', function(fireDate){
	fetchOrder();
	setTimeout(function() {
		fetchOrder();
	}, 15000)
	setTimeout(function() {
		fetchOrder();
	}, 30000)
	setTimeout(function() {
		fetchOrder();
	}, 45000)
});

function fetchOrder() {
	var contact = contacts[contactIndex];

	pizzapi.Track.byPhone(
		contact.phone,
		function(pizzaData){
			if( Object.keys(pizzaData.orders).length > 0 ) {
				if(pizzaData.orders["OrderStatus"] && !alreadyEmailed(contact.name, pizzaData.orders["OrderStatus"]["AsOfTime"])) {
					mailOptions.text = contact.name + ': ' + JSON.stringify(pizzaData);
					addToEmailSentList(contact.name, pizzaData.orders["OrderStatus"]["AsOfTime"])
					console.log('Pizza Found!', contact.name, pizzaData);
					console.log('Emails Sent', emailsSent)
				} else {
					console.log(contact.name + ' skipped. Email already sent.')
				}
			} else {
				console.log('No Pizza Found', contact.name, pizzaData)
			}
		}
		);


	if( mailOptions.text ) {
		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});
	}

	mailOptions.text = null;
	incremmentContactIndex();
}

function incremmentContactIndex() {
	if(contactIndex === contacts.length - 1) {
		contactIndex = 0
	} else {
		contactIndex++;
	}
}

function alreadyEmailed(name, timestamp) {
	return emailsSent[timestamp] && emailsSent[timestamp][name] === true;
}

function addToEmailSentList(name, timestamp) {
	if(!emailsSent[timestamp]) {
		emailsSent[timestamp] = {};
	}
	emailsSent[timestamp][name] = true;
}

// npm dominos out of date. Had to update tracking url in node_module
// "track": "https://order.dominos.com/orderstorage/GetTrackerData?"