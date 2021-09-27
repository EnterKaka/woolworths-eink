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
  //get the token from the header if present
  //if no token found, return response (without going to the next middelware)
    //if can verify the token, set req.user and pass to next middleware
};