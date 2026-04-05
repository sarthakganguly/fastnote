import os
import traceback 
from flask import Blueprint, request, jsonify, g, current_app
from app.core.security import token_required
from app.extensions import db
from app.models.user import User
from dodopayments import DodoPayments

try:
    from dodopayments.environments import DodoPaymentsEnvironment
except ImportError:
    DodoPaymentsEnvironment = None

payments_bp = Blueprint('payments_bp', __name__)

def get_dodo_client():
    api_key = os.environ.get("DODO_PAYMENTS_API_KEY")
    client_kwargs = {"bearer_token": api_key}
    
    # Check what environment is requested
    env_request = os.environ.get("DODO_PAYMENTS_ENVIRONMENT", "live_mode")
    
    if DodoPaymentsEnvironment:
        if env_request == "test_mode":
            client_kwargs["environment"] = DodoPaymentsEnvironment.TEST_MODE
        else:
            client_kwargs["environment"] = DodoPaymentsEnvironment.LIVE_MODE
    else:
        # BETTER LOGGING: Let us know the import failed
        current_app.logger.warning("DodoPaymentsEnvironment import failed. Falling back to string assignment.")
        # Modern Python SDKs often accept the string directly if the Enum is missing
        client_kwargs["environment"] = env_request

    # BETTER LOGGING: Verify exactly what is being passed to the SDK
    current_app.logger.info(f"Dodo SDK Initialized -> Environment: {client_kwargs.get('environment')}")
            
    return DodoPayments(**client_kwargs)

@payments_bp.route('/create-checkout', methods=['POST'])
@token_required
def create_checkout():
    client = get_dodo_client()
    try:
        session = client.checkout_sessions.create(
            customer={"email": f"{g.current_user.username}@fastnote.local"},
            product_cart=[{"product_id": os.environ.get("DODO_PRODUCT_ID"), "quantity": 1}],
            metadata={"user_id": str(g.current_user.id)},
            return_url=os.environ.get("FRONTEND_URL", "http://localhost") + "?checkout=success"
        )
        return jsonify({"checkout_url": session.checkout_url}), 200
        
    except Exception as e:
        # --- NEW BETTER LOGGING ---
        error_trace = traceback.format_exc()
        current_app.logger.error("=== DODO API CRASH REPORT ===")
        current_app.logger.error(error_trace)
        
        # Check if environment variables are actually loading into Python
        api_key = os.environ.get("DODO_PAYMENTS_API_KEY", "MISSING")
        masked_key = f"{api_key[:8]}..." if len(api_key) > 8 else "MISSING_OR_TOO_SHORT"
        
        current_app.logger.error(f"DEBUG ENV: KEY={masked_key}")
        current_app.logger.error(f"DEBUG ENV: ENVIRONMENT={os.environ.get('DODO_PAYMENTS_ENVIRONMENT', 'MISSING')}")
        current_app.logger.error(f"DEBUG ENV: PRODUCT_ID={os.environ.get('DODO_PRODUCT_ID', 'MISSING')}")
        current_app.logger.error("=============================")
        
        return jsonify({"message": "Internal Server Error"}), 500

@payments_bp.route('/webhook', methods=['POST'])
def webhook_handler():
    """Securely listens for Dodo Payments state changes (trial started, expired, active)."""
    client = get_dodo_client()
    payload = request.get_data()

    # 1. Fetch your new webhook key from the environment
    webhook_secret = os.environ.get("DODO_PAYMENTS_WEBHOOK_KEY")

    if not webhook_secret:
        current_app.logger.error("CRITICAL: DODO_PAYMENTS_WEBHOOK_KEY is missing from environment variables.")
        return jsonify({"message": "Internal Server Error"}), 500
    
    try:
        # The SDK automatically verifies the cryptographic signature
        event = client.webhooks.unwrap(
            payload,
            headers={
                "webhook-id": request.headers.get("webhook-id"),
                "webhook-signature": request.headers.get("webhook-signature"),
                "webhook-timestamp": request.headers.get("webhook-timestamp")
            },
            
        )
    except Exception as e:
        current_app.logger.error(f"Webhook Signature Verification Failed: {e}")
        return jsonify({"message": "Invalid signature"}), 400

    # Process the event data
    event_data = event.data
    metadata = event_data.metadata or {}
    user_id = metadata.get('user_id')

    if not user_id:
        return jsonify({"received": True}), 200 # Ignore events without our metadata

    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({"received": True}), 200

    # Standard MoR Subscription Event Handling
    if event.type == 'subscription.trial_started':
        user.subscription_status = 'trialing'
        user.subscription_id = event_data.get('subscription_id')
        user.dodo_customer_id = event_data.get('customer_id')
        # Dodo provides the end date, or calculate it locally
        db.session.commit()
        
    elif event.type == 'subscription.active':
        user.subscription_status = 'active'
        db.session.commit()
        
    elif event.type == 'subscription.trial_expired' or event.type == 'subscription.past_due':
        user.subscription_status = 'expired'
        db.session.commit()
        
    elif event.type == 'subscription.canceled':
        user.subscription_status = 'canceled'
        db.session.commit()

    return jsonify({"received": True}), 200