import { Router } from 'express'
import { createToken, createUser, getUserCodes } from '../controllers/user.js'
import { isTokenValid } from '../middleware/auth.js'

const route = Router()

route.get('/jwt', isTokenValid)
route.get('/', isTokenValid, getUserCodes)
route.post('/register', createUser)
route.post('/login', createToken)

export default route
