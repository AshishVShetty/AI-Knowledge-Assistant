from pydantic import BaseModel, Field
from uuid import uuid4


class ChatRequest(BaseModel):
    question: str
    session_id: str = Field(default_factory=lambda: str(uuid4()))