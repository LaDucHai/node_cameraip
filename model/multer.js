const multer = require('multer');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

// multer
const storage = multer.diskStorage({
    destination(req, file, callback) {
      const mimetype = file.mimetype;
      const verified = getJwtVerify(req);
      if(mimetype==='video/mp4') {
        callback(null, `./${file.fieldname}/videos/${verified.AccountId}`);
      } else if((mimetype==='image/jpeg')||(mimetype==='image/png')||(mimetype==='image/jpg')) {
        callback(null, `./${file.fieldname}/images/${verified.AccountId}`);
      }
    },
    filename(req, file, callback) {
      const verified = getJwtVerify(req);
      callback(null, `${file.fieldname}_${verified.AccountId}_${Date.now()}_${Math.floor(Math.random()*10000)}_${file.originalname}`);
    },
});
  
const upload = multer({ storage });

function getJwtVerify(req) {
  try {
      const authHeader = req.headers[process.env.tokenLogin_TOKEN_HEADER_KEY];
      const token = authHeader && authHeader.split(" ")[1];
      if (token == null) return console.log('Token cant is NULL');
      const verified = jwt.verify(token, process.env.tokenLogin_JWT_SECRET_KEY);
      return verified;
  } catch (error) {
      console.error(error)
  }
};

module.exports = {upload};