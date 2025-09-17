"use client";

import React, { useState } from "react";

import styles from "./style.module.css"; 
import { Badge, Popover, IconButton, Typography, Box } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function Notification() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "notification-popover" : undefined;
  
  const empty = true;

  return (
    <>
      <IconButton
        aria-describedby={id}
        aria-label="Notificações"
        onClick={handleClick}
        sx={{
          cursor: "pointer",
          "&:hover": {
            color: "#5c5c5c",
          },
          color: "#949494", 
        }}
      >

        {empty ? (
          <NotificationsIcon sx={{ fontSize: "2rem" }} /> 
        ) : (
          <Badge badgeContent={4} color="error">
            <NotificationsIcon sx={{ fontSize: "2rem" }} />
          </Badge>
        )}

      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >

        <Box
          sx={{
            p: 2,
            minWidth: 200,
            textAlign: "center",
          }}
        >

          <Typography>Nenhuma notificação no momento.</Typography>

        </Box>
        
      </Popover>
    </>
  );
}