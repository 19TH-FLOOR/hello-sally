import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TemplateIcon from '@mui/icons-material/Description';
import Link from 'next/link';

export default function Home() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        헬로 샐리 관리 대시보드
      </Typography>
      <Typography variant="body1" paragraph>
        음성 파일 업로드, STT 결과 조회, 보고서 생성 및 관리를 위한 관리자 페이지입니다.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
              justifyContent: 'space-between',
              bgcolor: '#f5f5f5',
            }}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                보고서 관리
              </Typography>
              <Typography variant="body2">
                AI 분석 보고서를 생성하고 관리합니다. 음성 파일을 업로드하고 분석을 진행할 수 있습니다.
              </Typography>
            </Box>
            <Link href="/reports" passHref>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AssessmentIcon />}
                sx={{ width: 'fit-content' }}
              >
                보고서 관리
              </Button>
            </Link>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 200,
              justifyContent: 'space-between',
              bgcolor: '#f5f5f5',
            }}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                AI 프롬프트 관리
              </Typography>
              <Typography variant="body2">
                AI 분석을 위한 프롬프트를 관리합니다. 다양한 분석 유형에 맞는 프롬프트를 설정할 수 있습니다.
              </Typography>
            </Box>
            <Link href="/ai-prompts" passHref>
              <Button
                variant="contained"
                color="info"
                startIcon={<TemplateIcon />}
                sx={{ width: 'fit-content' }}
              >
                AI 프롬프트 관리
              </Button>
            </Link>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 