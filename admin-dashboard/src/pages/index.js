import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ListIcon from '@mui/icons-material/List';
import Link from 'next/link';

export default function Home() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        헬로 샐리 관리 대시보드
      </Typography>
      <Typography variant="body1" paragraph>
        음성 파일 업로드, STT 결과 조회, 데이터 관리를 위한 관리자 페이지입니다.
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
                음성 파일 업로드
              </Typography>
              <Typography variant="body2">
                음성 파일을 업로드하고 STT 처리를 진행합니다.
              </Typography>
            </Box>
            <Link href="/uploads/new" passHref>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{ width: 'fit-content' }}
              >
                업로드 하기
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
                파일 목록 보기
              </Typography>
              <Typography variant="body2">
                업로드된 파일 목록과 STT 결과를 확인합니다.
              </Typography>
            </Box>
            <Link href="/uploads" passHref>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ListIcon />}
                sx={{ width: 'fit-content' }}
              >
                목록 보기
              </Button>
            </Link>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 