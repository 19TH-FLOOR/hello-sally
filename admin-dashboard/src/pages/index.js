import { Box, Typography, Paper, Grid, Button, Container } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TemplateIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Link from 'next/link';

export default function Home() {
  return (
    <Box sx={{ flexGrow: 1, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">


        {/* 기능 카드 섹션 */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                height: 280,
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 2, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                    }}
                  >
                    <AssessmentIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    보고서 관리
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  AI 분석 보고서를 생성하고 관리합니다. 음성 파일을 업로드하고 분석을 진행할 수 있습니다.
                </Typography>
              </Box>
              <Link href="/reports" passHref>
                <Button
                  variant="contained"
                  startIcon={<AssessmentIcon />}
                  sx={{ 
                    width: 'fit-content',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)',
                    }
                  }}
                >
                  보고서 관리
                </Button>
              </Link>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                height: 280,
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 2, 
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
                    }}
                  >
                    <TemplateIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    AI 프롬프트 관리
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  AI 분석을 위한 프롬프트를 관리합니다. 다양한 분석 유형에 맞는 프롬프트를 설정할 수 있습니다.
                </Typography>
              </Box>
              <Link href="/ai-prompts" passHref>
                <Button
                  variant="contained"
                  startIcon={<TemplateIcon />}
                  sx={{ 
                    width: 'fit-content',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e879f9 0%, #ef4444 100%)',
                      boxShadow: '0 6px 24px rgba(240, 147, 251, 0.4)',
                    }
                  }}
                >
                  AI 프롬프트 관리
                </Button>
              </Link>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 