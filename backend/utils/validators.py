from config import Config


def allowed_file(filename, allowed_extensions):
    if not filename or "." not in filename:
        return False

    extension = filename.rsplit(".", 1)[1].lower()
    return extension in allowed_extensions


def is_pdf(filename):
    return allowed_file(filename, Config.ALLOWED_PDF_EXTENSIONS)


def is_image(filename):
    return allowed_file(filename, Config.ALLOWED_IMAGE_EXTENSIONS)


def required_fields(data, fields):
    missing = []

    for field in fields:
        if not data.get(field):
            missing.append(field)

    return missing