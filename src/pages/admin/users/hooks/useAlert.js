import { useState } from "react";

export default function useAlert() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "info",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  const showAlert = (
    type,
    title,
    message,
    showConfirm = false,
    onConfirm = null
  ) => {
    setAlertConfig({
      type,
      title,
      message,
      showConfirm,
      onConfirm,
    });
    setAlertOpen(true);

    if ((type === "success" || type === "info") && !showConfirm) {
      setTimeout(() => setAlertOpen(false), 4000);
    }
  };

  const closeAlert = () => {
    setAlertOpen(false);
  };

  return {
    alertOpen,
    alertConfig,
    showAlert,
    closeAlert,
  };
}
