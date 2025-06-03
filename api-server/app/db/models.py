from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class AudioFile(Base):
    __tablename__ = "audio_files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    s3_url = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow) 