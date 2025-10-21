export class ResponseUtil {
  static success(res, data, message, statusCode = 200) {
    const response = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static created(res, data, message) {
    return this.success(res, data, message, 201);
  }

  static error(res, message, statusCode = 500) {
    const response = {
      success: false,
      error: message,
    };
    return res.status(statusCode).json(response);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

