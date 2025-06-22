import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Link from 'next/link';

export default function ReportHeader({ 
  report, 
  isPolling
}) {
  return (
    <Box sx={{ mb: 4 }}>
      {/* 뒤로가기 버튼 섹션 */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          href="/reports"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ 
            borderColor: 'rgba(102, 126, 234, 0.3)',
            color: 'primary.main',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
            }
          }}
        >
          목록으로
        </Button>
      </Box>

      {/* 메인 헤더 섹션 */}
      <Box 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 제목과 폴링 상태 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              {report.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              보고서 상세 정보 및 음성 파일 관리
            </Typography>
          </Box>
          
          {/* STT 폴링 상태 표시 */}
          {isPolling && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              px: 3, 
              py: 1.5, 
              background: 'rgba(102, 126, 234, 0.1)',
              borderRadius: 2,
              border: '1px solid rgba(102, 126, 234, 0.2)',
              ml: 3
            }}>
              <CircularProgress size={16} sx={{ color: 'primary.main' }} />
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                STT 상태 확인 중...
              </Typography>
            </Box>
          )}
        </Box>

      </Box>
    </Box>
  );
} 