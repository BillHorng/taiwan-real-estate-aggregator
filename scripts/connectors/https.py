"""TLS context compatible with public-sector legacy certificate chains.

Python 3.13 enables VERIFY_X509_STRICT by default. Some otherwise trusted
government certificate chains omit a Subject Key Identifier. We relax only
that strict RFC check while keeping CA validation and hostname checks enabled.
"""
from __future__ import annotations
import ssl

def verified_context() -> ssl.SSLContext:
    context = ssl.create_default_context()
    if hasattr(ssl, "VERIFY_X509_STRICT"):
        context.verify_flags &= ~ssl.VERIFY_X509_STRICT
    return context
