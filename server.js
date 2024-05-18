if(process.env.NODE_ENV !== 'production')
{
}
require('dotenv').config()

const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)
const endpointSecret = "whsec_030b23968091e0616695a8ae9b14932141f5cea17c95bd5caff1b6bb266ad141"


app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())

app.get('/store', (req, res) => {
    fs.readFile('items.json', (err, data) => {
        if(err){
            res.status(500).end()
        }
        console.log(data)
        res.render('store.ejs', {
            items: JSON.parse(data),
            stripePublicKey: stripePublicKey
        })
    })
})

app.post('/purchase', (req, res) => {
    fs.readFile('items.json', (err, data) => {
        console.log(req.body)
        if(err){
            res.status(500).end()
        }else{
            const itemsJson = JSON.parse(data)
            console.log(itemsJson)
            const itemsArray = itemsJson.music.concat(itemsJson.shirt)
            let total = 0
            req.body.items.forEach(item => {
                const itemJson = itemsArray.find(i => {
                    return i.id == item.id
                })
                console.log(itemJson)
                total = total + itemJson.price * item.quantity
            })

            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'usd',
            })
            .then(() => {
                console.log('charge successful')
                res.json({message: 'Successfully purchased items'})
            })
            .catch(err => {
                console.log(err)
                res.status(500).end()
            })
        }
    })
})

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
    const sig = request.headers['stripe-signature'];
  
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

app.listen(3333)