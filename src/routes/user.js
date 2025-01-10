import { Router } from 'express'
import {
  createToken,
  createUser,
  editUser,
  getUserByCode,
  getUserCodes,
} from '../controllers/user.js'
import { isTokenValid } from '../middleware/auth.js'

const route = Router()

route.get('/jwt', isTokenValid, getUserByCode)
route.get('/', isTokenValid, getUserCodes)
route.post('/register', createUser)
route.post('/login', createToken)
route.put('/:code', editUser)

export default route
