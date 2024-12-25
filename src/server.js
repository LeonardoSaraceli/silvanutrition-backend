import 'dotenv/config'
import express, { json } from 'express'
import 'express-async-errors'
import morgan from 'morgan'
import cors from 'cors'
import ApiError from './errors/ApiError.js'
import userRoute from './routes/user.js'

const app = express()

app.use(json())
app.use(
  cors({
    origin: process.env.FRONTENDURL,
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
    preflightContinue: false,
  })
)
app.use(morgan('dev'))

app.use('/users', userRoute)

app.use((error, req, res, next) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
    })
  }

  res.status(500).json({
    error,
  })
})

export default app
