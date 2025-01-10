import { db } from '../lib/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const getUserCodesDb = async (userCode, startDate, endDate) => {
  const validStatuses = [
    'ready-for-handling',
    'handling',
    'invoiced',
    'delivered',
    'order-completed',
  ]

  let totalOrders = 0
  let totalAmount = 0
  const orderDetailsArray = []

  for (let page = 1; ; page++) {
    const queryData = await fetch(
      `${process.env.VTEXURL}?f_creationDate=creationDate:[${
        startDate ?? '1970-01-01T00:00:00.000Z'
      } TO ${
        endDate ?? new Date().toISOString()
      }]&f_status=${validStatuses.join(',')}&page=${page}&per_page=100`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VTEX-API-AppKey': process.env.VTEXKEY,
          'X-VTEX-API-AppToken': process.env.VTEXTOKEN,
        },
      }
    ).then((res) => res.json())

    if (!queryData.list || queryData.list.length === 0) break

    const orders = queryData.list

    await Promise.all(
      orders.map(async (order) => {
        try {
          const orderDetails = await fetch(
            `${process.env.VTEXURL}/${order.orderId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-VTEX-API-AppKey': process.env.VTEXKEY,
                'X-VTEX-API-AppToken': process.env.VTEXTOKEN,
              },
            }
          ).then((res) => res.json())

          const couponData =
            orderDetails.ratesAndBenefitsData?.rateAndBenefitsIdentifiers.find(
              (entry) =>
                entry.matchedParameters[
                  'couponCode@Marketing'
                ]?.toLowerCase() === userCode.toLowerCase()
            )

          if (couponData) {
            totalOrders++
            totalAmount += order.totalValue / 100

            orderDetailsArray.push({
              buyer: orderDetails.clientProfileData.firstName,
              total: (order.totalValue / 100).toFixed(2),
              date: new Date(order.creationDate).toLocaleDateString('pt-BR'),
              comission: ((order.totalValue / 100) * 0.15).toFixed(2),
            })
          }
        } catch (err) {
          console.error(
            `Failed to fetch details for order ${order.orderId}`,
            err
          )
        }
      })
    )

    if (page >= queryData.paging.pages) break
  }

  return {
    orders: totalOrders,
    ammount: totalAmount.toFixed(2),
    comission: (totalAmount * 0.15).toFixed(2),
    orderDetailsArray,
  }
}

const getUserByCodeDb = async (code) => {
  return await db.query('SELECT * FROM users WHERE code = $1', [code])
}

const createUserDb = async (code, password) => {
  return await db.query('INSERT INTO users (code, password) VALUES ($1, $2)', [
    code,
    await bcrypt.hash(String(password), 10),
  ])
}

const verifyPasswordDb = async (formPw, userPw) => {
  return await bcrypt.compare(String(formPw), String(userPw))
}

const createTokenDb = (userCode, secretKey) => {
  return jwt.sign({ code: userCode }, secretKey)
}

const editUserDb = (userPassword, userCode) => {
  return db.query('UPDATE users SET password = $1 WHERE code = $2', [
    userPassword,
    userCode,
  ])
}

export {
  getUserCodesDb,
  getUserByCodeDb,
  createUserDb,
  verifyPasswordDb,
  createTokenDb,
  editUserDb,
}
