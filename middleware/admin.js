const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function(req, res, next) {
  console.log(req.user);
    var priv = req.user.privilege;
    if(priv.toLowerCase() == 'admin'){
      next();
    }else{
      res.redirect('/');
    }
};