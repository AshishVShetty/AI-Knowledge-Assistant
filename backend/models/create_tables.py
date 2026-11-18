from models.user import Base
from config.database import engine

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")