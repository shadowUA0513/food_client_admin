import { notifications } from "@mantine/notifications";
import {
  IconRosetteDiscountCheckFilled,
  IconAlertCircleFilled,
} from "@tabler/icons-react";

type NotificationOptions = {
  message: string;
  title?: string;
};

export function showSuccessNotification({
  message,
  title = "Success",
}: NotificationOptions) {
  notifications.show({
    color: "green",
    title,
    message,
    autoClose: 3500,
    radius: "lg",
    withBorder: true,
    styles: {
      root: {
        backgroundColor: "#ebfbee",
        borderColor: "#8ce99a",
        boxShadow: "0 10px 30px rgba(47, 158, 68, 0.12)",
      },
      title: {
        color: "#2b8a3e",
        fontWeight: 700,
      },
      description: {
        color: "#2f4f2f",
      },
      icon: {
        backgroundColor: "#2f9e44",
        color: "#ffffff",
      },
      closeButton: {
        color: "#2b8a3e",
      },
    },
    icon: <IconRosetteDiscountCheckFilled size={18} />,
  });
}

export function showErrorNotification({
  message,
  title = "Error",
}: NotificationOptions) {
  notifications.show({
    color: "red",
    title,
    message,
    autoClose: 4500,
    radius: "lg",
    withBorder: true,
    styles: {
      root: {
        backgroundColor: "#fff5f5",
        borderColor: "#ffa8a8",
        boxShadow: "0 10px 30px rgba(240, 62, 62, 0.12)",
      },
      title: {
        color: "#c92a2a",
        fontWeight: 700,
      },
      description: {
        color: "#5f2120",
      },
      icon: {
        backgroundColor: "#e03131",
        color: "#ffffff",
      },
      closeButton: {
        color: "#c92a2a",
      },
    },
    icon: <IconAlertCircleFilled size={18} />,
  });
}
