import {
  createTokenDb,
  createUserDb,
  editUserDb,
  getUserByCodeDb,
  getUserCodesDb,
  verifyPasswordDb,
} from '../domains/user.js'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../errors/ApiError.js'

const getUserByCode = async (req, res) => {
  const user = await getUserByCodeDb(req.user.code)

  if (!user.rowCount) {
    throw new NotFoundError('User not found')
  }

  delete user.rows[0].password

  return res.json({
    user: user.rows[0],
  })
}

const getUserCodes = async (req, res) => {
  const { startDate, endDate } = req.query

  const { orders, ammount, comission, orderDetailsArray } =
    await getUserCodesDb(req.user.code, startDate, endDate)

  res.json({
    code: req.user.code,
    startDate: startDate ?? '2024-11-15T00:00:00.000Z',
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

  const token = createTokenDb(
    code.toLowerCase(),
    user.rows[0].role,
    process.env.SECRETKEY
  )

  res.status(201).json({
    token,
    role: user.rows[0].role,
  })
}

const editUser = async (req, res) => {
  const { password } = req.body
  const { code } = req.params

  const user = await getUserByCodeDb(code)

  if (!user.rows) {
    throw new NotFoundError('User not found')
  }

  await editUserDb(password, code)
  const updatedUser = await getUserByCodeDb(code)
  delete updatedUser.rows[0].password

  return res.json({
    user: updatedUser.rows[0],
  })
}

export { getUserByCode, getUserCodes, createUser, createToken, editUser }
