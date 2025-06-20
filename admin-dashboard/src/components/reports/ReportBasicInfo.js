import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { formatToKoreanDateTime } from '../../utils/dateUtils';

export default function ReportBasicInfo({ report, getStatusColor, getStatusText }) {
  return (
    <Card
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: 'primary.main',
            mb: 3
          }}
        >
          기본 정보
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            상태
          </Typography>
          <Chip
            label={getStatusText(report.status)}
            color={getStatusColor(report.status)}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            부모 이름
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {report.parent_name || '미지정'}
          </Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            아이 이름
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {report.child_name || '미지정'}
          </Typography>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            생성일
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formatToKoreanDateTime(report.created_at)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
            수정일
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formatToKoreanDateTime(report.updated_at)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
} 