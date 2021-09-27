const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function(req, res, next) {
    var priv = req.user.privilege;
    if(priv.toLowerCase() == 'admin'){
      next();
    }else{
      res.redirect('/');
    }
};