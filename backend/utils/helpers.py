from flask import jsonify


def success_response(message, data=None, status_code=200):
    response = {
        "success": True,
        "message": message
    }

    if data is not None:
        response["data"] = data

    return jsonify(response), status_code


def error_response(message, status_code=400):
    return jsonify({
        "success": False,
        "message": message
    }), status_code


def get_nested_value(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)

    return getattr(obj, key, default)


def get_user_id_from_auth_user(auth_user):
    if not auth_user:
        return None

    if isinstance(auth_user, dict):
        user = auth_user.get("user", auth_user)
        return user.get("id")

    user = getattr(auth_user, "user", auth_user)
    return getattr(user, "id", None)


def get_user_email_from_auth_user(auth_user):
    if not auth_user:
        return None

    if isinstance(auth_user, dict):
        user = auth_user.get("user", auth_user)
        return user.get("email")

    user = getattr(auth_user, "user", auth_user)
    return getattr(user, "email", None)