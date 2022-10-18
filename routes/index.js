const e = require('express');
var express = require('express');
var router = express.Router();
var con = require('../config/Config')
let Razorpay = require('../Payments/RazorPay')
let {checkUser}=require('../Middlewares/checkUser');
// let nodemailer =  require('../MailServers/Nodemailer')
let nodemailer = require('nodemailer');
/* GET home page. */
router.get('/', function(req, res, next) {
  var user = req.session.user;
  con.query("select * from Products",(err,row)=>{
    if(err){
      console.log(err)
    }else{
      
      res.render('user/home',{user,products:row});
     
      var sql = "SELECT COUNT(*) as data from cart where userID = ? and status = 'cart'or status = 'processing'";
      if(req.session.user){
        var userid = user.id;
        con.query(sql,userid,(err,result)=>{
          if(err){
            console.log(err)
          }else{
           
            var cartNo = result[0].data;
            console.log(cartNo);
            user.Tcart = cartNo;
            console.log("products:",row)
            res.render('user/home',{user,products:row});
          }
        })
      }
      }
  })
});
router.get('/cart', function (req, res, next) {
  res.render('user/Cart',{singlePage:true});
});
router.get('/myorder', function(req, res, next) {
  res.render('user/myOrder',{singlePage:true});
});
router.post('/Register',(req,res)=>{
  console.log(req.body)
  var sql="Insert into user set ?"
  var email_id=req.body.Email_id;
  var sql1 ="Select * from user where Email_id = ?"
  con.query(sql1,[email_id],(err,result)=>{
    if(err){
      console.log(err)
    }else{
          if(result.length>0){
            res.redirect('/')
          }else{
            con.query(sql,req.body,(err,row)=>{
              if(err){
                console.log(err)
              }else{
                res.redirect('/')
              }
            })
      }
    }
  })
 
})
router.post('/login',(req,res)=>{
  var Email_id = req.body.Email_id;
  var Password= req.body.Pass;
  console.log(req.body)
  console.log(Email_id,Password)
  var sql = "Select * from user where Email_id = ? and Password = ?"
  con.query(sql,[Email_id,Password],(err,result)=>{
    if(err){
      console.log(err)
    }else{
      if(result.length>0 ){
        var user = result[0];
        req.session.user=user;
        
        console.log("login success")
        res.redirect('/')
      }else{
       console.log("Login Error")
      }
      
    }
  })
})
router.get('/addToCart',checkUser,(req,res)=>{
  var userID = req.session.user.id;
  // var tax =0;
  var Total = 0;
  var sql = "Select products.id,products.Name,products.description,products.price,products.img,cart.userID,cart.qnty from products inner join cart on products.id =cart.productID where cart.userID=? and cart.status= 'cart' or cart.status = 'processing'";
  con.query(sql,userID,(err,result)=>{
    if(err){
      console.log(err)
    }else{
      
      console.log("Cart",result)
      result.forEach(o =>  Total =  o.price*o.qnty+Total);
      var tax = (Total * 18)/100;
      var subTotal = 0;
      subTotal = Total + tax;
      var user = req.session.user;
      res.render('user/Cart',{singlePage:true,result,Total,tax,subTotal,user});
    }
  })
})

router.get('/addToCart/:productID',checkUser,(req,res)=>{
      console.log(req.params.productID)
      var Product =req.params.productID;
      var sql = "insert into cart set ?"
        var userID = req.session.user.id;
        var data = {
          productID:Product,
          userID:userID
        }
    con.query(sql,data,(err,result)=>{
          if(err){
            console.log(err)
          }else{
              res.redirect('/')
          }
        })
        
})
router.get('/RemoveFromCart/:id',(req,res)=>{
  var Productid=req.params.id;
  console.log("producId",Productid);
  var sql ="update cart set status ='removed' where productID= ?"
  con.query(sql,[Productid],(err,row)=>{
    if(err){
      console.log(err)
    }else{
      res.redirect('/addToCart')
    }
  })
})
router.get('/addQNTY/:id',(req,res)=>{
  var id = req.params.id;
  var userid = req.session.user.id;
  var sql ="select * from cart where userID = ? and productID =?"
  con.query(sql,[userid,id],(err,row)=>{
      if(err){
        console.log(err)
      }else{
        var Fqnty = row[0].qnty;
        var newqnty = Fqnty + 1;
        var sql2 = "update cart set qnty = ? where productID= ? and userID = ?"
        con.query(sql2,[newqnty,id,userid],(err,result)=>{
          if(err){
            console.log(err)
          }else{
                res.redirect('/addToCart')
          }
        })
      }
  }) 
})
router.get('/subQNTY/:id',(req,res)=>{
  var id = req.params.id;
  var userid = req.session.user.id;
  var sql ="select * from cart where userID = ? and productID =?"
  con.query(sql,[userid,id],(err,row)=>{
      if(err){
        console.log(err)
      }else{
        var Fqnty = row[0].qnty;
        if(Fqnty ==1){
          var newqnty =1;
        }else{
          var newqnty = Fqnty - 1;
        }
       
        var sql2 = "update cart set qnty = ? where productID= ? and userID = ?"
        con.query(sql2,[newqnty,id,userid],(err,result)=>{
          if(err){
            console.log(err)
          }else{
                res.redirect('/addToCart')
          }
        })
      }
  })
})
router.get('/createOrder/:amount',(req,res)=>{
  var amount = req.params.amount;
  // console.log(Tamount)
  let userId = req.session.user.id;
  var options = {
    amount: amount*100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  Razorpay.orders.create(options, function(err, order) {
    console.log(order);
    var user = req.session.user;
    var sql = "update cart set status = 'processing' where userID = ?"
    con.query(sql,[userId],(err,row)=>{
      if(err){
        console.log(err)
      }else{
        res.render("user/check2",{singlePage:true,order,user})
      }
    })
  });
})
router.get('/createDirectOrder/:amount/:id',checkUser,(req,res)=>{
  var amount = req.params.amount;
  let pid = req.params.id;
  // console.log(Tamount)
  let userId = req.session.user.id;
  var options = {
    amount: amount*100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
  };
  Razorpay.orders.create(options, function(err, order) {
    console.log(order);
    var user = req.session.user;
    let userid = req.session.user.id;
    let productID = pid;
    let qnty =1;
    let status = 'processing'
    var sql = "insert into cart set ?"
    var data = {
      userID:userid,
      productID,
      qnty,
      status
    }
    con.query(sql,data,(err,row)=>{
      if(err){
        console.log(err)
      }else{
        res.render("user/check2",{singlePage:true,order,user})
      }
    })
  });
})
router.post('/varify', async (req,res)=>{
  var usermail =  req.session.user.Email_id;
  var crypto = require('crypto')
  var userId =req.session.user.id;
  var paidAmnt = req.body.amount/100;
  console.log(paidAmnt)
  var data = req.body;
  var order_id = data['response[razorpay_order_id]']
  var payment_id = data[ 'response[razorpay_payment_id]']
  const razorpay_signature = data[ 'response[razorpay_signature]']
  const key_secret = "DkNW0S4KbIGO9x25IPRyyDcu";
  let hmac = crypto.createHmac('sha256', key_secret); 
  await hmac.update(order_id + "|" + payment_id);
  const generated_signature = hmac.digest('hex');
  if(razorpay_signature===generated_signature){
    var sql = "update cart set status = 'purchased' where userID = ?"
    con.query(sql,[userId],(err,row)=>{
      if(err){
        console.log(err)
      }else{
        let transporter = nodemailer.createTransport({
          service:'gmail',
          auth:{
            user:'ecommercetest246@gmail.com',
            pass:'iftgqrcgrduigxuk'
          },
          tls:{
            rejectUnauthorized:false,
          },
        })
        let mailOption  = {
          from:"RayBan Ecommerce Team",
          to:usermail,
          subject:"Order has been  Placed!! your items will reach you as soon as possible,thank you for using our Reyban eccommerce platform!! Happy shopping!",
        };
        transporter.sendMail(mailOption,function(err,info){
          if(err){
            console.log(err)
          }else{
            console.log("emailsent Succecfully")
            res.redirect('/')
          }
        })
       
      }
    })
  
}else{
  console.log("Payed failed")
  res.render('user/checkOut');
}
})
router.get('/myOrders',checkUser,(req,res)=>{
  var userid = req.session.user.id;
  var Total = 0;
  var sql = "Select products.id,products.Name,products.description,products.price,products.img,cart.userID,cart.qnty from products inner join cart on products.id =cart.productID where cart.userID=? and cart.status= 'purchased'";
  con.query(sql,[userid],(err,result)=>{
    if(err){
      console.log(err)
    }else{
      console.log("Cart",result)
      result.forEach(o =>  Total =  o.price*o.qnty+Total);
      var tax = (Total * 18)/100;
      var subTotal = 0;
      subTotal = Total + tax;
      var user = req.session.user;
      res.render('user/MyOrders',{singlePage:true,result,Total,tax,subTotal,user});
    }
  })

})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
module.exports = router;
