var express = require('express')
var router = express.Router()
var User = require('../models/user')
var Otp = require('../models/otp')
var Pizza = require('../models/pizza')
var Feedback = require('../models/feedback')
var Cart = require('../models/cart')
var Order = require('../models/order')
const jwt = require('jsonwebtoken')
var sendMail = require('../mail/mail')
var bcrypt = require('bcrypt')


router.get('/check', verifyToken, (req, res, next) => {
    res.json({ msg: "All ok" })
})


function addToDB(req, res) {

    var user = new User({
        name: req.body.name,
        contact: req.body.contact,
        email: req.body.email,
        password: User.hashPassword(req.body.p1),
    });
    user.save((error, registeredUser) => {
        if (error) {
            console.log(error);
        }
        else {
            let payload = { subject: registeredUser._id }
            let token = jwt.sign(payload, 'secretkey')
            res.status(200).json({ token: token })
        }
    })
}


router.post('/register', function (req, res, next) {
    addToDB(req, res);
});

router.post('/login', function (req, res, next) {

    User.findOne({ email: req.body.email }, (err, user) => {

        if (err) {
            console.log(err)
            res.status(401).send(err)
        }
        else {
            if (!user) {
                res.json({ error: 'Invalid Email' })
            }
            else {
                bcrypt.compare(req.body.password, user.password).then(match => {
                    if (match) {
                        console.log("login sucesssss");
                        let payload = { subject: user._id }
                        let token = jwt.sign(payload, 'secretkey')
                        res.status(200).json({ token: token })
                    }
                    else {
                        console.log("incoreect passss");
                        res.json({ error: 'Incorrect password!!' })
                    }
                }).catch(err => {
                    console.log("somthing wrong");
                    res.json({ error: 'Somthing went wrong' })
                })
            }
        }
    })
});

function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send("unauthorized req")
    }
    let token = req.headers.authorization.split(' ')[1]
    // console.log(token);
    if (token == 'null') {
        return res.status(401).send("unauthorized req")
    }
    let payload = jwt.verify(token, 'secretkey')
    if (!payload) {
        return res.status(401).send("unauthorized req")
    }
    req.userId = payload.subject
    // console.log("userrrrrrrrrrrrrrrrrrrrr");
    // console.log(req.userId);
    next()
}

function getEmail(email) {
    Otp.find({ email: email }, (err, otps) => {

        if (err) {
            console.log("err in finding email ");
            res.status(500).json({ errmsg: err })
        }
        if (otps.length != 0) {
            console.log("yes in delete");
            Otp.deleteOne({ email: email }, (err) => {
                if (err)
                    console.log("err in delete");
            }
            )
        }
    })
}

router.post('/reset', async function (req, res, next) {
    var email = req.body.email
    var x = await getEmail(req.body.email)
    setTimeout( async function(){ 
        console.log("time");
        var y = await getEmail(email)
    }, 2*60000);
    var a = Math.floor(1000 + Math.random() * 9000);
    var otp = new Otp({
        otp: a,
        email: req.body.email
    });

    console.log("otp =", otp);
    try {
        doc = otp.save();
        console.log("yes inserted");
        sendMail(otp.email, otp.otp);
        return res.status(201).json(doc);
    }
    catch (err) {
        return res.status(501).json(err);
    }
});

// 
router.get('/otp', (req, res, next) => {

    
    Otp.find({}, (err, otps) => {
        if (err) {
            console.log("err otp");
            res.status(500).json({ errmsg: err })
        }
        // console.log(otps);
        res.status(200).json({ msg: otps })
    })
})

router.put('/forgot-password-done',async (req, res, next) => {
    var p = User.hashPassword(req.body.p1)
    var x = await getEmail(req.body.email)
    User.updateOne({ email: req.body.email },
        { password: p }, function (err, user) {
            console.log(1);
            if (err) {
                console.log(err)
                res.status(500).json({ errmsg: err })
            }
            else {
                res.status(201).json(user);
            }
        });
})



router.post('/logout', function (req, res, next) {
    try {
        req.logout()
    } catch (error) {
        res.status(500).json({ msg: error })
    }
    res.status(500).json({ msg: "logged out" })

});



router.get('/read', (req, res, next) => {
    User.find({}, (err, users) => {
        if (err) {
            res.status(500).json({ errmsg: err })
        }
        res.status(200).json({ msg: users })
    })
})

router.get('/getallpizza', verifyToken, (req, res, next) => {
    Pizza.find({}, (err, pizzas) => {
        if (err) {
            res.status(500).json({ errmsg: err })
        }
        res.status(200).json({ msg: pizzas })
    })
})


router.delete("/getoneuser/:id", verifyToken, (req, res, next) => {

    User.findOne({ email: req.params.id }, (error, user) => {
        if (error) {
            console.log(error)
            res.status(401).send(error)
        }
        else {
            res.status(200).json({ user: user })
        } 
    })
})

// editprofile
router.get("/editprofile", verifyToken, (req, res, next) => {

    User.updateOne({ _id: req.query.id }, {
        name: req.query.name,
        email: req.query.email,
        contact: req.query.contact
    }, function (err, user) {
        console.log(1);
        if (err) {
            console.log(err)
            res.status(500).json({ errmsg: err })
        }
        else {
            console.log("edited profile");
            res.status(201).json(user);
        }
    })
})


// changepassword
router.post('/changepassword', function (req, res, next) {
    User.findOne({ email: req.body.email }, (err, user) => {
        // console.log(user);
        if (err) {
            console.log(err)
            res.status(401).send(err)
        }
        else {
            if (!user) {
                res.json({ error: 'Invalid Email' })
            }
            else {
                bcrypt.compare(req.body.op, user.password).then(match => {
                    if (match) {
                        console.log("old password  sucesssss");
                        var p = User.hashPassword(req.body.p1)
                        User.updateOne({ email: req.body.email },
                            { password: p }, function (err, user) {

                                if (err) {
                                    console.log(err)
                                    res.status(500).json({ err: err })
                                }
                                else {
                                    console.log("changed password");
                                    res.status(200).json({ msg: "changed password" })
                                }
                            })
                    }
                    else {
                        console.log("incoreect passss");
                        res.json({ error: 'Incorrect old password!!' })
                    }
                }).catch(err => {
                    console.log("somthing wrong");
                    res.json({ error: 'Somthing went wrong' })
                })
            }
        }
    })
});


// sendfeedback
router.post('/sendfeedback', verifyToken, function (req, res, next) {
    var feedback = new Feedback({
        whichuser: req.userId,
        name: req.body.name,
        email: req.body.email,
        msg: req.body.msg
    });
    feedback.save((error, fb) => {
        if (error) {
            console.log(error);
            res.json({ msg: error })
        }
        else {
            res.json({ msg: "success", feedback: fb })
        }
    })
});




function secondtimecart(req, res, oldcart, newpizza, userid) {
    var oldavail = false;
   
    var newtotal = oldcart.total + newpizza.pizzaprice;
    var tot;
   
    var oldpiizajsonarr = oldcart['pizza']
   
    for (var i = 0; i < oldpiizajsonarr.length; i++) {
        if (oldpiizajsonarr[i]._id == newpizza._id) {
            oldavail = true;
        }
    }

    if (oldavail) {

        for (var i = 0; i < oldpiizajsonarr.length; i++) {
            if (oldpiizajsonarr[i]._id == newpizza._id) {
                oldpiizajsonarr[i].qty += 1;
                oldcart.total += oldpiizajsonarr[i].pizzaprice
                tot = oldcart.total
                console.log(oldcart.total);
            }
        }

        console.log(oldpiizajsonarr);

        Cart.updateOne({ _id: oldcart._id }, {
            pizza: oldpiizajsonarr,
            total: tot
        }, function (err, ct) {

            if (err) {
                console.log(err)
                res.status(500).json({ msg: err })
            }
            else {
                console.log("edited cart");
                res.json({ msg: "pizza added to the cart" })
            }
        })
    }
    else {

        console.log("no not in cart");
        oldpiizajsonarr.push(newpizza)
        Cart.updateOne({ _id: oldcart._id }, {
            pizza: oldpiizajsonarr,
            total: newtotal
        }, function (err, ct) {

            if (err) {
                console.log(err)
                res.status(500).json({ msg: err })
            }
            else {
                console.log("edited cart");
                res.json({ msg: "pizza added to the cart" })
            }
        })

    }
}

router.post('/addtocart', verifyToken, function (req, res, next) {
    Cart.findOne({ whichuser: req.userId }, (error, cart) => {
        if (error) {
            console.log(error)
            res.status(401).send(error)
        }
        else {
            if (!cart) {
                console.log("firsttime");
                var cart = new Cart({
                    whichuser: req.userId,
                    pizza: req.body,
                    total: req.body.pizzaprice
                });
                cart.save((error, ct) => {
                    if (error) {
                        console.log(error);
                        res.json({ msg: error })
                    }
                    else {
                        console.log("sucess fully added your first item");
                        res.json({ msg: "success", cart: ct })
                    }
                })
            }
            else {
                console.log("secondtime");
                secondtimecart(req, res, cart, req.body, req.userId);
                // res.json({ error: 'second time' })
            }
        }
    })


    // res.json({ msg: "success"})      
});



router.get('/getcartitem', verifyToken, (req, res, next) => {
    Cart.find({ whichuser: req.userId }, (err, pizzas) => {
        if (err) {
            res.status(500).json({ error: err })
        }
        res.send(pizzas)
    })
})



function deletefromcart(req, res, oldcart, newpizza, userid) {
    var temp = [];
    var total;
    var oldpiizajsonarr = oldcart['pizza']
   
   
    for (var i = 0; i < oldpiizajsonarr.length; i++) {
        if (oldpiizajsonarr[i]._id != newpizza._id) {
            temp.push(oldpiizajsonarr[i])
        }
        else {
            oldcart.total -= newpizza.pizzaprice * newpizza.qty;
            total = oldcart.total;
        }
    }
    if (total == 0) {
        Cart.deleteOne({ _id: oldcart._id }, (err) => {
            if (err) {
                console.log("err in place order");
                res.json({ msg: err })
            }
        })
        res.json({ msg: "pizza deleted from the cart" })

    }
    else {
        Cart.updateOne({ _id: oldcart._id }, {
            pizza: temp,
            total: total
        }, function (err, ct) {

            if (err) {
                console.log(err)
                res.status(500).json({ msg: err })
            }
            else {
                console.log("deleted from  cart");
                res.json({ msg: "pizza deleted from the cart" })
            }
        })
    }

}



router.post('/deletefromcart', verifyToken, function (req, res, next) {
   
    Cart.findOne({ whichuser: req.userId }, (error, cart) => {
        if (error) {
            console.log(error)
            res.status(401).send(error)
        }
        else {
            if (!cart) {
                res.json({ msg: "not found!" })
            }
            else {
                console.log("deleted from cart!");
                deletefromcart(req, res, cart, req.body, req.userId);
            }
        }
    })


    // res.json({ msg: "success"})      
});



router.get('/emptycheck', verifyToken, (req, res, next) => {
    Cart.find({ whichuser: req.userId }, (err, pizzas) => {
        if (err) {
            res.status(500).json({ msg: err })
        }
       
        if (pizzas.length == 0) {
            res.json({ msg: "yes empty cart" })
        }
        else {
            res.json({ msg: "not empty cart" })
        }
    })
})



router.post('/placeorder', verifyToken, (req, res, next) => {

    Cart.findOne({ whichuser: req.userId }, async (error, cart) => {
        if (error) {
            console.log(error)
            res.status(401).send(error)
        }
        else {
            var x = await SaveinOrder(req, res, cart)
            var y = await Place(req, res)
        }
    })


})


function SaveinOrder(req, res, cart) {
    var order = new Order({
        whichuser: cart.whichuser,
        pizza: cart.pizza,
        total: cart.total,
    })
    order.save((error, a) => {
        if (error) {
            console.log(error);
        }
        else {
            console.log("order saved in order table");
        }
    })
}

function Place(req, res) {
    Cart.deleteOne({ whichuser: req.userId }, (err) => {
        if (err) {
            console.log("err in place order");
            res.json({ msg: err })
        }
    })
    res.status(200).json({ msg: "order placed" })
}


module.exports = router

