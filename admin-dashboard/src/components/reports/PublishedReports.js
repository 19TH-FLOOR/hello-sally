import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemText, 
  Button 
} from '@mui/material';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { formatToKoreanDateTime } from '../../utils/dateUtils';

export default function PublishedReports({ report }) {
  if (!report.published_reports || report.published_reports.length === 0) {
    return null;
  }

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
          발행된 보고서
        </Typography>
        
        <List sx={{ p: 0 }}>
          {report.published_reports.map((publishedReport, index) => (
            <ListItem 
              key={publishedReport.id}
              sx={{
                px: 0,
                py: 2,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon sx={{ color: 'error.main' }} />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      발행된 보고서 #{index + 1}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      발행일: {formatToKoreanDateTime(publishedReport.published_at)}
                    </Typography>
                    {publishedReport.pdf_url && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PdfIcon />}
                        href={publishedReport.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          mt: 1,
                          borderColor: 'error.main',
                          color: 'error.main',
                          '&:hover': {
                            borderColor: 'error.dark',
                            backgroundColor: 'rgba(244, 67, 54, 0.04)',
                          }
                        }}
                      >
                        PDF 다운로드
                      </Button>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
} 