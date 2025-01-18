class ApiError extends Error {
  constructor(statusCode, message) {
    super()
    this.statusCode = statusCode
    this.message = message
  }
}

class BadRequestError extends ApiError {
  constructor(message) {
    super(400, message)
  }
}

class InvalidTokenError extends ApiError {
  constructor(message) {
    super(401, message)
  }
}

class UnauthorizedTokenError extends ApiError {
  constructor(message) {
    super(403, message)
  }
}

class NotFoundError extends ApiError {
  constructor(message) {
    super(404, message)
  }
}

class ConflictError extends ApiError {
  constructor(message) {
    super(409, message)
  }
}

export default ApiError
export {
  BadRequestError,
  InvalidTokenError,
  UnauthorizedTokenError,
  NotFoundError,
  ConflictError,
}
