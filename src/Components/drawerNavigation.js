// components/DrawerNavigation.js
import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';  // For the hamburger icon

export default function DrawerNavigation() {
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <div>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={toggleDrawer}
        sx={{ display: { sm: 'none' }, marginLeft: '10px' }}
      >
        <MenuIcon />
      </IconButton>
      
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: '250px',
            padding: '10px',
          },
        }}
      >
        <List>
          <ListItem button>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Users" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Bills" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Overview" />
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
}
