import logging
import sys

def setup_logging(level="INFO"):
    """Configures centralized structured logging for the app."""
    logger = logging.getLogger()
    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    if logger.hasHandlers():
        logger.handlers.clear()
        
    logger.addHandler(handler)
    
    # Suppress noisy external library logs
    logging.getLogger("werkzeug").setLevel(logging.WARNING)