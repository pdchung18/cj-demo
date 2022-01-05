import React from "react";

import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { HighlightOff } from "@mui/icons-material";

export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose?: () => void;
}

export const BootstrapDialogTitle = (props: DialogTitleProps) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 3 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme: any) => theme.palette.grey[400],
          }}
        >
          <HighlightOff fontSize="large" />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
};
