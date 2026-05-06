import { Box, Center, Stack, Text } from "@mantine/core";
import { IconPhotoOff } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { env } from "../../service/api/env";

type ImagePreviewProps = {
  imageUrl?: string | null;
  alt: string;
  emptyLabel: string;
  height?: number;
  maxWidth?: number;
};

function getPreviewUrl(imageUrl?: string | null) {
  if (!imageUrl?.trim()) {
    return "";
  }

  try {
    return new URL(imageUrl, env.baseUrl).toString();
  } catch {
    return imageUrl;
  }
}

export function ImagePreview({
  imageUrl,
  alt,
  emptyLabel,
  height = 220,
  maxWidth = 320,
}: ImagePreviewProps) {
  const previewUrl = getPreviewUrl(imageUrl);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [previewUrl]);

  if (!previewUrl || hasImageError) {
    return (
      <Center
        h={height}
        style={{
          width: "100%",
          maxWidth,
          borderRadius: "var(--mantine-radius-md)",
          background:
            "linear-gradient(135deg, var(--mantine-color-gray-1), var(--mantine-color-gray-0))",
          border: "1px dashed var(--mantine-color-gray-4)",
        }}
      >
        <Stack align="center" gap={6}>
          <IconPhotoOff size={34} color="var(--mantine-color-gray-6)" />
          <Text size="sm" c="dimmed">
            {emptyLabel}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box
      component="img"
      src={previewUrl}
      alt={alt}
      h={height}
      w="100%"
      onError={() => {
        setHasImageError(true);
      }}
      style={{
        objectFit: "cover",
        display: "block",
        maxWidth,
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-gray-3)",
      }}
    />
  );
}
