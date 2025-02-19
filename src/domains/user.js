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

  let currentEndDate = endDate ?? new Date().toISOString()

  for (let page = 1; ; page++) {
    const queryData = await fetch(
      `${process.env.VTEXURL}?f_creationDate=creationDate:[${
        startDate ?? '2024-11-15T00:00:00.000Z'
      } TO ${currentEndDate}]&f_status=${validStatuses.join(
        ','
      )}&page=${page}&per_page=100`,
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
            const totalPrice =
              orderDetails.totals.find((total) => total.id === 'Items')?.value /
              100

            const totalDiscount =
              orderDetails.totals.find((total) => total.id === 'Discounts')
                ?.value / 100

            totalOrders++
            totalAmount += totalPrice + totalDiscount

            orderDetailsArray.push({
              buyer: orderDetails.clientProfileData.firstName,
              total: (totalPrice + totalDiscount).toFixed(2),
              date: new Date(order.creationDate).toLocaleDateString('pt-BR'),
              comission: ((totalPrice + totalDiscount) * 0.15).toFixed(2),
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

    if (page === 30) {
      const lastOrderDate = orderDetailsArray[orderDetailsArray.length - 1].date

      const [dia, mes, ano] = lastOrderDate.split('/')
      const data = new Date(ano, mes - 1, dia)

      data.setDate(data.getDate() - 1)
      data.setHours(23, 59, 59, 999)

      const dataIso = data.toISOString()

      currentEndDate = dataIso
      page = 1
    }

    if (page === queryData.paging.pages) break
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

const createTokenDb = (userCode, userRole, secretKey) => {
  return jwt.sign({ code: userCode, role: userRole }, secretKey)
}

const editUserDb = async (userPassword, userCode) => {
  return db.query('UPDATE users SET password = $1 WHERE code = $2', [
    await bcrypt.hash(String(userPassword), 10),
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
