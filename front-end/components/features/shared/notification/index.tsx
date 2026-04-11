"use client"

import React, { useEffect, useState } from "react";

import { useNotificationStore } from '@/stores/notification';

import styles from "./style.module.css";

const icons = {
  success: "✔️",
  failed: "❌",
  info: "ℹ️"
};

export default function Notification() {
  const { message, type, show, hideNotification } = useNotificationStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let visibilityTimer: NodeJS.Timeout;
    let hideStoreTimer: NodeJS.Timeout;

    if (show) {
      setIsVisible(true);

      visibilityTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      hideStoreTimer = setTimeout(() => {
        hideNotification();
      }, 5000 + 500);

    } else {
      setIsVisible(false);
    }

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(hideStoreTimer);
    };
  }, [show, message, type, hideNotification]);

  if (!show) {
    return null;
  }

  return (
    <div
      className={[
        styles.notification,
        styles[`notification--${type}`],
        !isVisible && styles["notification--hidden"]
      ].filter(Boolean).join(" ")}
    >
      <span className={styles.notification__icon}>{icons[type]}</span>
      <span>
        {typeof message === "string" ? message : String(message)}
      </span>
    </div>
  );
};