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

app.listen(3333)