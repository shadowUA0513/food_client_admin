import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

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
    icon: <IconCheck size={16} />,
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
    icon: <IconX size={16} />,
  });
}
