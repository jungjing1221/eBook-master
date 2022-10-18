const express = require("express")
const pool = require("../config")
const Joi = require('joi')
const bcrypt = require('bcrypt');
const { generateToken } = require("../utils/token");
const { isLoggedIn } = require('../middlewares');
const { resourceUsage } = require("process");

router = express.Router();

const passwordValidator = (value, helpers) => {
    if (value.length < 8) {
        throw new Joi.ValidationError('Password must contain at least 8 characters')
    }
    if (!(value.match(/[a-z]/) && value.match(/[A-Z]/) && value.match(/[0-9]/))) {
        throw new Joi.ValidationError('Password must be harder')
    }
    return value
}

const usernameValidator = async (value, helpers) => {
    const [rows, _] = await pool.query("SELECT username FROM customer WHERE username = ?", [value])
    if (rows.length > 0) {
        const message = 'This username is already taken'
        throw new Joi.ValidationError(message, { message })
    }
    return value
}

const signupSchema = Joi.object({
    name: Joi.string(),
    username: Joi.string().min(5).max(20).external(usernameValidator),
    password: Joi.string().custom(passwordValidator),
    phone:  Joi.string().pattern(/0[0-9]{9}/),
    confirm_password:Joi.valid(Joi.ref('password')),
    email:  Joi.string(),
    sex:  Joi.string(),
    date:  Joi.string(),
}).unknown();   

const changepass = Joi.object({
    password:Joi.string(),
    new_password: Joi.string().custom(passwordValidator),
    con_new_password:Joi.valid(Joi.ref('new_password')),

}).unknown();   


//signup
router.post('/user/signup', async (req, res, next) => {
    try {
        const value = await signupSchema.validateAsync(req.body, { abortEarly: false });
    } catch (err) {
        if (err.details[0] === undefined) {
            return res.status(400).send(err.details.message)
        }

        return res.status(400).send(err.details[0].message)
    }

    const conn = await pool.getConnection()
    await conn.beginTransaction()

    const name = req.body.name.split(" ");

    try {
        await conn.query(
            'INSERT INTO `customer` (`username`, `password`, `date`, `fname`, `lname`,`phone`,`email`,`grade`,`sex` ) VALUES (?, ?, ?, ?, ?,?,?,"Bronze",?)',
            [req.body.username, await bcrypt.hash(req.body.password, 5),req.body.date, name[0], name[1],req.body.phone,req.body.email,req.body.sex])
        
        conn.commit()
        res.status(201).send()
    } catch (err) {
        conn.rollback()
        res.status(400).json(err.toString());
    } finally {
        conn.release()
    }
})
const loginSchema = Joi.object({
     username: Joi.string().required(),
     password: Joi.string().required()
 })
 

//login
 router.post('/user/login', async (req, res, next) => {
     try {
         await loginSchema.validateAsync(req.body, { abortEarly: false })
     } catch (err) {
         return res.status(400).send('err')
     }
     const username = req.body.username
     const password = req.body.password
 
     const conn = await pool.getConnection()
     await conn.beginTransaction()
 
     try {
         // Check username correct
         const [users] = await conn.query(
             'SELECT * FROM customer WHERE username=?', 
             [username]
         )
         let user = users[0]
         if(users[0] === undefined){
             
            const [adminUser] = await conn.query(
                'SELECT * FROM admin WHERE username=?', 
                [username])
                
            user = adminUser[0]
         }

        
         if (!user) {
             throw new Error('Incorrect username or password')
         }
             // Check password
         if (!(await bcrypt.compare(password, user.password))) {
             throw new Error('Incorrect username or password')
         }
         let token =""
         if (user.grade){
             const [tokens] = await conn.query(
             'SELECT * FROM tokens WHERE cus_id=?', 
             [user.customer_id]
         )
         
         token = tokens[0]?.token
         
         if (!token) {
             token = generateToken()
             console.log(token)
             await conn.query(
                 'INSERT INTO tokens(cus_id, token) VALUES (?, ?)', 
                 [user.customer_id, token]
             )
         }}
         else{
            const [tokens] = await conn.query(
                'SELECT * FROM tokens WHERE ad_id=?', 
                [user.admin_id]
            )
            
            token = tokens[0]?.token
            
            if (!token) {
                token = generateToken()
                await conn.query(
                    'INSERT INTO tokens(ad_id, token) VALUES (?, ?)', 
                    [user.admin_id, token]
                )
            }
         }
         
 
         conn.commit()
         res.status(200).json({'token': token})
     } catch (error) {
         conn.rollback()
         res.status(400).json(error.toString())
     } finally {
         conn.release()
     }
 })

//show user
router.get('/user/show', async (req, res, next) => {
    try {
        const [rows, fields] = await pool.query("SELECT * FROM customer WHERE customer_id = ?", req.body.id)

      return res.json(rows);
    }
    catch (err) {
      console.log("-----")
      return res.status(500).json(err)
    }
  })

//change pass
router.put('/change_password',isLoggedIn, async (req, res, next) => {
    try {
        const value = await changepass.validateAsync(req.body, { abortEarly: false });
    } catch (err) {

        return res.status(400).send(err.details[0].message)
    }
    try {
        console.log(   )
        const pass = await pool.query('select password from customer where customer_id = ?', [req.body.customer_id])
        if (!(await bcrypt.compare(req.body.password, pass[0][0].password))) {
            return res.status(400).send('Incorrect old password')
        }
        await pool.query('update customer set password = ? where customer_id = ?', [
            await bcrypt.hash(req.body.new_password, 5), req.body.customer_id
            // Zaza456654
        ])
        return res.json({
            message: "Change password success"
        });
    }
    catch (err) {
      return res.status(500).send(err)
    }
})

 router.get('/user/me', isLoggedIn, async (req, res, next) => {
     res.json(req.user)
    //  res.json({user:req.user})
    })
exports.router = router