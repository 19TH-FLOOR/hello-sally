import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  AppBar, Toolbar, Typography, Drawer, Box, List, 
  ListItem, ListItemIcon, ListItemText, IconButton, Container,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';

const drawerWidth = 240;

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: '홈', icon: <HomeIcon />, path: '/' },
    { text: '보고서 관리', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'AI 프롬프트 관리', icon: <DescriptionIcon />, path: '/ai-prompts' },
  ];

  const drawer = (
    <div>
      <Toolbar 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: '64px !important',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box 
            sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
              S
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              테스트 관리자
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
              Owner
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const isSelected = router.pathname === item.path;
          return (
            <ListItem 
              key={item.text}
              button 
              component={Link}
              href={item.path}
              sx={{ 
                color: 'inherit',
                textDecoration: 'none',
                borderRadius: 2,
                mb: 0.5,
                mx: 0.5,
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: isSelected ? 'rgba(63, 81, 181, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  transform: 'translateX(4px)',
                },
                ...(isSelected && {
                  backgroundColor: 'rgba(63, 81, 181, 0.08)',
                  borderLeft: '4px solid',
                  borderLeftColor: 'primary.main',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    backgroundColor: 'primary.main',
                    borderRadius: '0 4px 4px 0',
                  }
                })
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  minWidth: 40,
                  transition: 'color 0.2s ease-in-out',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiListItemText-primary': {
                    color: isSelected ? 'primary.main' : 'text.primary',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease-in-out',
                  }
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '1.2rem'
            }}
          >
            헬로 샐리 관리 대시보드
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#fafafa',
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#fafafa',
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
} 