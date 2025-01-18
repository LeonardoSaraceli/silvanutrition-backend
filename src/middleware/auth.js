import jwt from 'jsonwebtoken'
import {
  InvalidTokenError,
  UnauthorizedTokenError,
} from '../errors/ApiError.js'

const isTokenValid = (req, res, next) => {
  try {
    const headers = req.headers['authorization']

    const token = headers.split(' ')[1]

    const payload = jwt.verify(token, process.env.SECRETKEY)

    req.user = payload

    next()
  } catch (error) {
    throw new InvalidTokenError('Invalid token')
  }
}

const isAuthorized = (req, res, next) => {
  try {
    const headers = req.headers['authorization']

    const token = headers.split(' ')[1]

    const payload = jwt.verify(token, process.env.SECRETKEY)

    req.user = payload

    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedTokenError('Unauthorized token')
    }

    next()
  } catch (error) {
    throw new InvalidTokenError('Invalid token')
  }
}

export { isTokenValid, isAuthorized }
