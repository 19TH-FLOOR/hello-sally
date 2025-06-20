import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails 
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { formatToKoreanDateTime } from '../../utils/dateUtils';

export default function AnalysisResults({ report }) {
  if (!report.report_data || report.report_data.length === 0) {
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
          AI 분석 결과
        </Typography>
        
        {report.report_data.map((data, index) => (
          <Accordion 
            key={data.id}
            elevation={0}
            sx={{
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              mb: 2,
              '&:before': {
                display: 'none',
              },
              '&:last-child': {
                mb: 0,
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                }
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  분석 결과 #{index + 1}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatToKoreanDateTime(data.generated_at)}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box
                sx={{
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2,
                  p: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: '400px',
                  overflow: 'auto',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
              >
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  margin: 0,
                  fontFamily: 'inherit',
                  fontSize: 'inherit'
                }}>
                  {JSON.stringify(data.analysis_data, null, 2)}
                </pre>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
} 