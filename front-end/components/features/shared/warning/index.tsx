"use client"

import React, { useEffect, useState } from "react";
import { Check, X, Info } from "lucide-react";

import { useWarningStore } from '@/lib/stores/warning';

import styles from "./style.module.css";

const icons = {
  success: Check,
  failed: X,
  info: Info
};

export default function Warning() {
  const { message, type, show, hideWarning } = useWarningStore();
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
        hideWarning();
      }, 5000 + 500);

    } else {
      setIsVisible(false);
    }

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(hideStoreTimer);
    };
  }, [show, message, type, hideWarning]);

  if (!show) {
    return null;
  }

  const Icon = icons[type];

  return (
    <div
      className={[
        styles.warning,
        styles[`warning--${type}`],
        !isVisible && styles["warning--hidden"]
      ].filter(Boolean).join(" ")}
    >
      <span className={styles.warning__icon}>
        <Icon size={24} />
      </span>
      <span>
        {typeof message === "string" ? message : String(message)}
      </span>
    </div>
  );
};