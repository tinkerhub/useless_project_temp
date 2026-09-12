from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes
import base64

# 1. Receiver generates their keys
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)
public_key = private_key.public_key()

# 2. Sender encrypts using the receiver's public key
message = b"Secret payload: only intended user can see this!"
encrypted_data = public_key.encrypt(
    message,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
encoded_encrypted = base64.b64encode(encrypted_data).decode('utf-8')
print("Encrypted base64:", encoded_encrypted)

# 3. Only the receiver decrypts using their private key
decrypted_data = private_key.decrypt(
    base64.b64decode(encoded_encrypted.encode('utf-8')),
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
print("Decrypted message:", decrypted_data.decode('utf-8'))