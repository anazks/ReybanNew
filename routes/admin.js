var express = require('express');
var router = express.Router();
var con = require('../config/Config')
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/Login')
});
router.get('/adminHome',  function(req, res, next) {
    con.query("SELECT COUNT(*)   AS total from products;",(err,row)=>{
        if(err){
            console.log(err)
        }else{
            con.query("SELECT COUNT(*)   AS totaluser from user;",(err,result)=>{
                let admin= req.session.admin
                var products=row[0]
                var users=result[0].totaluser;
                var totalProduct = products.total;
                console.log("pradmind",users)
                var sql= ""
                con.query("SELECT COUNT(*)   AS tottalorder from cart where status = 'purchased';",(err,row2)=>{
                  if(err){
                    console.log(err)
                  }else{
                    let totalOrder =row2[0].tottalorder;
                    admin.Products =totalProduct
                    admin.totalOrder=totalOrder;
                    admin.totalUser = users;
                    admin.orders = totalOrder;
                    con.query("Select products.id,products.Name,products.description,products.price,products.img,cart.userID,cart.status,cart.qnty,cart.userID from products inner join cart on products.id =cart.productID where  cart.status= 'purchased'",(err,products)=>{
                      if(err){
                        console.log(err)
                      }else{
                        console.log(products)
                        res.render('admin/NewAdminHome',{admin,products})
                      }
                    })
                   
                    // res.render('admin/NewAdminHome',{admin,users,})
                  }
                })
               
            })
           
        }
    })
  });
router.post('/login',(req,res)=>{
    var name = "admin";
    var password = "admin";
    var admin = {
        name,
        password
    }
    if(req.body.name==name && req.body.password==password){
        console.log("login success")
        req.session.admin=admin;
       res.redirect('/admin/adminHome')
    }else{
        console.log("login error")
    }
    
})
router.post('/addProduct',(req,res)=>{
    var image_name;
    if(!req.files) return res.status(400).send("no files were uploaded.");
    var file=req.files.images;
  var image_name = file.name;
  let sql="INSERT INTO products SET ?";
  console.log(file)
  console.log(image_name);
  if(file.mimetype =="image/jpeg" || file.mimetype =="image/png" || file.mimetype =="image/gif"
  ){
    file.mv("public/images/products/"+file.name,function(err){
      if(err) return res.status(500).send(err);
      console.log(image_name);
  
  let data={
    Name:req.body.Name,
    description:req.body.description,
    price:req.body.price,
    img:image_name,
  }; 
  console.log(data)
  con.query(sql,data,(err,result)=>{
    if(err){
      console.log(err)
    }else{
        res.redirect('/admin/adminHome')
    }
  })
  }) 
  } 
})
router.get('/viewDetails/:userid',(req,res)=>{
  let userid = req.params.userid;
  console.log(userid)
  con.query("Select products.id,products.Name,products.description,products.price,products.img,cart.userID,cart.status,cart.qnty,cart.userID from products inner join cart on products.id =cart.productID where  cart.status= 'purchased' and cart.userID = ?",[userid],(err,products)=>{
    if(err){
      console.log(err)
    }else{
      console.log("product user",products)
     res.render('admin/viewDetails',{products})
    }
  })

})
router.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/admin/')
})
module.exports = router;
