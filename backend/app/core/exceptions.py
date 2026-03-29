from flask import jsonify
import logging

logger = logging.getLogger(__name__)

class APIException(Exception):
    """Custom exception for expected API errors."""
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code

def register_error_handlers(app):
    """Registers global error handlers to prevent raw HTML 500s."""
    @app.errorhandler(APIException)
    def handle_api_exception(err):
        logger.warning(f"API Error ({err.status_code}): {err.message}")
        return jsonify({"message": err.message}), err.status_code

    @app.errorhandler(500)
    def handle_internal_error(err):
        logger.error(f"Internal Server Error: {err}", exc_info=True)
        return jsonify({"message": "An internal server error occurred"}), 500

    @app.errorhandler(404)
    def handle_not_found(err):
        return jsonify({"message": "Resource not found"}), 404