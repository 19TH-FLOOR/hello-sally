from app.db.session import SessionLocal
from app.db.models import AudioFile

db = SessionLocal()
files = db.query(AudioFile).all()

print('=== 현재 DB 상태 ===')
for file in files:
    print(f'ID: {file.id}')
    print(f'파일명: {file.filename}')
    print(f'STT 상태: {file.stt_status}')
    print(f'STT 텍스트: {repr(file.stt_transcript)}')
    print(f'STT 처리시간: {file.stt_processed_at}')
    print(f'STT 에러: {file.stt_error_message}')
    print('---')

db.close() 