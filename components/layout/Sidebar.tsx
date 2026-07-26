'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';

import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const expandedWidth = 260;
const collapsedWidth = 80;

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Company', href: '/company', icon: <BusinessIcon /> },
  { label: 'Order', href: '/order', icon: <ShoppingCartIcon /> },
  { label: 'User', href: '/user', icon: <PeopleIcon /> },
  { label: 'AI Agent', href: '/ai-agent', icon: <SmartToyIcon /> },
];

export default function Sidebar({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const drawerWidth = open ? expandedWidth : collapsedWidth;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar />

      <Box sx={{ display: 'flex', justifyContent: open ? 'flex-end' : 'center', px: 1 }}>
        <IconButton onClick={onToggle}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>

      <List sx={{ px: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                mb: 1,
                borderRadius: 2,
                justifyContent: open ? 'initial' : 'center',
                backgroundColor: active ? '#e8f7f1' : 'transparent',
                color: active ? '#00a76f' : '#637381',
                '&:hover': {
                  backgroundColor: '#e8f7f1',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: open ? 48 : 0,
                  color: 'inherit',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>

              {open && <ListItemText primary={item.label} />}
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

export const sidebarWidths = {
  expanded: expandedWidth,
  collapsed: collapsedWidth,
};
