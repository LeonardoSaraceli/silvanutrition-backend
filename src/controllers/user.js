import {
  createTokenDb,
  createUserDb,
  getUserByCodeDb,
  getUserCodesDb,
  verifyPasswordDb,
} from '../domains/user.js'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../errors/ApiError.js'

const getUserCodes = async (req, res) => {
  const { startDate, endDate } = req.query

  const { orders, ammount, comission, orderDetailsArray } =
    await getUserCodesDb(req.user.code, startDate, endDate)

  res.json({
    code: req.user.code,
    startDate: startDate ?? '1970-01-01T00:00:00.000Z',
    endDate: endDate ?? new Date().toISOString(),
    totalOrders: orders,
    totalAmmount: parseFloat(ammount),
    comission: parseFloat(comission),
    ordersDetails: orderDetailsArray,
  })
}

const createUser = async (req, res) => {
  const { code, password } = req.body

  if (!code || !password) {
    throw new BadRequestError('Missing fields in request body')
  }

  const user = await getUserByCodeDb(code.toLowerCase())

  if (user.rowCount) {
    throw new ConflictError('User already registered')
  }

  await createUserDb(code.toLowerCase(), password)
  const createdUser = await getUserByCodeDb(code.toLowerCase())
  delete createdUser.rows[0].password

  return res.status(201).json({
    user: createdUser.rows[0],
  })
}

const createToken = async (req, res) => {
  const { code, password } = req.body

  if (!code || !password) {
    throw new BadRequestError('Missing fields in request body')
  }

  const user = await getUserByCodeDb(code.toLowerCase())

  if (!user.rowCount) {
    throw new NotFoundError('User not found')
  }

  const isPasswordValid = await verifyPasswordDb(
    password,
    user.rows[0].password
  )

  if (!isPasswordValid) {
    throw new NotFoundError('User not found')
  }

  const token = createTokenDb(code.toLowerCase(), process.env.SECRETKEY)

  res.status(201).json({
    token,
  })
}

export { getUserCodes, createUser, createToken }
