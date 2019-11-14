const router = require('express').Router();
const bParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
router.use(bParser.urlencoded({extended:true}));
router.use(bParser.json());
const User = require('../model/users.js');
router.use(cors());

function verifyToken(req,res,next){
    if(!req.headers.authorization)
        return  res.status(400).send('Invalid Request');
   let token = req.headers.authorization.split(' ')[1];
   if(!token)
        return  res.send(400).send('Invalid Request'); 
   else
        var payload = jwt.verify(token, 'password123');
    if(!payload) 
        return res.status(400).send('Invalid Request');

    req.uid = payload.uid;
    req.name = payload.name;
    next();
}


router.post('/login', async (req,res)=>{
    let {email, password} = req.body;
    let u = await User.findOne({email, password},{_id:1, fname:1})
    if(u){
        let token =  jwt.sign({'uid': u.id, 'name': u.fname},'password123', {expiresIn: '1h'});
        res.status(200).send({token});
    }
    else
       res.status(200).send({err:'Invalid Credentials'});
})

router.post('/register', async (req,res,next)=>{
    let {fname, lname, email, password} = req.body;
    let u = await User.findOne({email: email},{_id:1})
    if(u)
        res.status(200).send({err:'User Already Registered'});
    else{
        u = new User({fname, lname, email, password});
        await u.save();
        res.status(200).send({message: 'User Registered'});
    }
})
router.get('/editor', verifyToken,(req,res)=>{
    res.status(200).send(req.name);
})

module.exports = router;