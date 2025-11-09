# 🔐 Security Functions
# Password hashing, JWT token creation/verification, and security utilities

import html
import re
from datetime import datetime, timedelta
from typing import Optional, Union

from app.core.config import settings
from jose import JWTError, jwt  # type: ignore
from passlib.context import CryptContext  # type: ignore

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, int],
    expires_delta: Optional[timedelta] = None,
    role: Optional[str] = None,
    must_change_password: Optional[bool] = None,
) -> str:
    """
    Create a new JWT access token.

    Args:
        subject: The subject (usually user ID) to encode in the token
        expires_delta: Custom expiration time, defaults to settings value
        role: User role to include in token payload
        must_change_password: Whether user must change password

    Returns:
        str: Encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject)}

    # Add optional fields to payload
    if role is not None:
        to_encode["role"] = role
    if must_change_password is not None:
        to_encode["must_change_password"] = must_change_password

    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string

    Returns:
        dict: Decoded token payload

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise JWTError("Invalid token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database

    Returns:
        bool: True if password matches, False otherwise
    """
    # Bcrypt has a maximum password length of 72 bytes
    # Truncate to 72 bytes if password is too long
    if isinstance(plain_password, str):
        plain_password_bytes = plain_password.encode("utf-8")
        if len(plain_password_bytes) > 72:
            plain_password = plain_password_bytes[:72].decode("utf-8", errors="ignore")

    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generate password hash.

    Args:
        password: Plain text password

    Returns:
        str: Hashed password
    """
    # Bcrypt has a maximum password length of 72 bytes
    # Truncate to 72 bytes if password is too long
    if isinstance(password, str):
        password_bytes = password.encode("utf-8")
        if len(password_bytes) > 72:
            password = password_bytes[:72].decode("utf-8", errors="ignore")

    return pwd_context.hash(password)


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify password reset token and return user email.

    Args:
        token: Password reset token

    Returns:
        Optional[str]: User email if token is valid, None otherwise
    """
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return decoded_token.get("sub")
    except JWTError:
        return None


def generate_password_reset_token(email: str) -> str:
    """
    Generate a password reset token.

    Args:
        email: User email address

    Returns:
        str: Password reset token
    """
    delta = timedelta(hours=24)  # Token expires in 24 hours
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


# ============================================================================
# HTML Sanitization & XSS Prevention
# ============================================================================


def sanitize_html(text: Optional[str], allow_basic_formatting: bool = False) -> Optional[str]:
    """
    Sanitize HTML content to prevent XSS attacks.

    This function removes dangerous HTML tags and attributes while optionally
    preserving basic formatting tags like <b>, <i>, <p>, <br>.

    Args:
        text: The text content to sanitize
        allow_basic_formatting: If True, allows basic HTML formatting tags.
                               If False, strips all HTML tags.

    Returns:
        Sanitized text with dangerous content removed, or None if input is None

    Examples:
        >>> sanitize_html("<script>alert('xss')</script>Hello")
        "Hello"

        >>> sanitize_html("<b>Bold</b> text", allow_basic_formatting=True)
        "<b>Bold</b> text"
    """
    if text is None:
        return None

    if not isinstance(text, str):
        return str(text)

    # List of dangerous tags to always remove
    dangerous_tags = [
        'script', 'iframe', 'object', 'embed', 'applet',
        'link', 'style', 'meta', 'base', 'form',
    ]

    # List of dangerous attributes to remove
    dangerous_attrs = [
        'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
        'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur',
        'onchange', 'onsubmit', 'onreset', 'onselect', 'onabort',
        'javascript:', 'data:', 'vbscript:',
    ]

    # Remove dangerous tags and their content
    for tag in dangerous_tags:
        # Remove opening tag, content, and closing tag
        pattern = f'<{tag}[^>]*>.*?</{tag}>'
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        # Remove self-closing tags
        pattern = f'<{tag}[^>]*/>'
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Remove dangerous attributes from remaining tags
    for attr in dangerous_attrs:
        # Remove attribute="value" or attribute='value' or attribute=value
        pattern = f'{attr}\\s*=\\s*["\']?[^"\'\\s>]*["\']?'
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # If basic formatting is not allowed, strip all remaining HTML tags
    if not allow_basic_formatting:
        text = re.sub('<[^>]+>', '', text)

    # Escape any remaining special HTML characters to prevent injection
    # This converts < > & " ' to their HTML entity equivalents
    if not allow_basic_formatting:
        text = html.escape(text)

    return text.strip()


def sanitize_text_input(text: Optional[str], max_length: Optional[int] = None) -> Optional[str]:
    """
    Sanitize plain text input by removing all HTML and limiting length.

    Args:
        text: The text to sanitize
        max_length: Maximum allowed length (characters will be truncated)

    Returns:
        Sanitized text with all HTML removed, or None if input is None
    """
    if text is None:
        return None

    # Remove all HTML tags
    sanitized = sanitize_html(text, allow_basic_formatting=False)

    # Trim to max length if specified
    if max_length and sanitized and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized


def sanitize_rich_text(text: Optional[str]) -> Optional[str]:
    """
    Sanitize rich text that may contain basic HTML formatting.

    Allows safe HTML tags like <b>, <i>, <u>, <p>, <br>, <ul>, <ol>, <li>
    while removing dangerous content.

    Args:
        text: The rich text content to sanitize

    Returns:
        Sanitized text with dangerous content removed, basic formatting preserved
    """
    if text is None:
        return None

    # First pass: remove dangerous content
    sanitized = sanitize_html(text, allow_basic_formatting=True)

    # Whitelist of allowed tags for rich text
    allowed_tags = {'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}

    # Remove tags not in whitelist
    def replace_tag(match):
        tag = match.group(1).lower()
        if tag.startswith('/'):
            tag = tag[1:]  # Remove slash for closing tags
        if tag in allowed_tags:
            return match.group(0)  # Keep allowed tags
        return ''  # Remove disallowed tags

    # Pattern to match HTML tags
    pattern = r'<(/?\w+)(?:\s[^>]*)?>'
    if sanitized is None:
        return None
    sanitized = re.sub(pattern, replace_tag, sanitized, flags=re.IGNORECASE)

    return sanitized
