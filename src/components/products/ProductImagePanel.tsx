import {
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import {
  IconHistory,
  IconPhoto,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { ImagePreview } from "../common/ImagePreview";
import {
  generateProductImage,
  uploadImage,
  useProductImageHistory,
} from "../../service/images";

type ProductImagePanelProps = {
  companyId?: string;
  productId?: string;
  imageUrl: string;
  productNameUz: string;
  productNameRu: string;
  description: string;
  descriptionUz: string;
  onImageUrlChange: (value: string) => void;
  onProcessingChange?: (isProcessing: boolean) => void;
};

const MAX_IMAGE_SIZE_BYTES = 200 * 1024;
const MAX_HISTORY_ITEMS = 4;

function formatFileSize(bytes: number) {
  return `${Math.ceil(bytes / 1024)} KB`;
}

function getDraftProductId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pushUniqueUrl(urls: string[], nextUrl: string) {
  return [nextUrl, ...urls.filter((value) => value !== nextUrl)].slice(
    0,
    MAX_HISTORY_ITEMS,
  );
}

export function ProductImagePanel({
  companyId,
  productId,
  imageUrl,
  productNameUz,
  productNameRu,
  description,
  descriptionUz,
  onImageUrlChange,
  onProcessingChange,
}: ProductImagePanelProps) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftProductIdRef = useRef(getDraftProductId());
  const [history, setHistory] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState<"product" | "prompt">(
    "product",
  );
  const [customPrompt, setCustomPrompt] = useState("");
  const [isConfirmStage, setIsConfirmStage] = useState(false);
  const {
    data: remoteHistory,
    error: historyError,
    isLoading: isHistoryLoading,
  } = useProductImageHistory(productId);

  const isProcessing = isUploading || isGenerating;

  useEffect(() => {
    onProcessingChange?.(isProcessing);
  }, [isProcessing, onProcessingChange]);

  useEffect(() => {
    setHistory([]);
  }, [productId]);

  useEffect(() => {
    if (!imageUrl.trim()) {
      return;
    }

    setHistory((current) => pushUniqueUrl(current, imageUrl.trim()));
  }, [imageUrl]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    setHistory((current) => {
      const merged = [...(remoteHistory ?? []), ...current];

      return merged
        .filter((value, index) => merged.indexOf(value) === index)
        .slice(0, MAX_HISTORY_ITEMS);
    });
  }, [productId, remoteHistory]);

  useEffect(() => {
    return () => {
      onProcessingChange?.(false);
    };
  }, [onProcessingChange]);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalError(t("upload.chooseImageFile"));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setLocalError(
        t("upload.imageMinSize", {
          size: formatFileSize(MAX_IMAGE_SIZE_BYTES),
        }),
      );
      return;
    }

    try {
      setLocalError(null);
      setIsUploading(true);
      const nextImageUrl = await uploadImage(file);

      if (imageUrl.trim() && imageUrl.trim() !== nextImageUrl) {
        setHistory((current) => pushUniqueUrl(current, imageUrl.trim()));
      }

      onImageUrlChange(nextImageUrl);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : t("companyDetails.productImageUploadError"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openGenerateModal = () => {
    setLocalError(null);
    setGenerateMode("product");
    setCustomPrompt("");
    setIsConfirmStage(false);
    setIsGenerateModalOpen(true);
  };

  const closeGenerateModal = () => {
    if (isGenerating) {
      return;
    }

    setIsGenerateModalOpen(false);
    setIsConfirmStage(false);
  };

  const handleContinueToConfirm = () => {
    if (!companyId) {
      setLocalError(t("companyDetails.productImageMissingCompany"));
      return;
    }

    if (generateMode === "prompt") {
      if (!customPrompt.trim()) {
        setLocalError(t("companyDetails.productImagePromptRequired"));
        return;
      }
    } else if (
      !productNameUz.trim() &&
      !productNameRu.trim() &&
      !description.trim() &&
      !descriptionUz.trim()
    ) {
      setLocalError(t("companyDetails.productImageMissingContent"));
      return;
    }

    setLocalError(null);
    setIsConfirmStage(true);
  };

  const handleGenerateImage = async () => {
    if (!companyId) {
      setLocalError(t("companyDetails.productImageMissingCompany"));
      return;
    }

    const payload =
      generateMode === "prompt"
        ? {
            company_id: companyId,
            prompt: customPrompt.trim(),
          }
        : {
            company_id: companyId,
            name_uz: productNameUz.trim(),
            name_ru: productNameRu.trim(),
            description: description.trim(),
            description_uz: descriptionUz.trim(),
          };

    try {
      setLocalError(null);
      setIsGenerating(true);
      const nextImageUrl = await generateProductImage(
        productId ?? draftProductIdRef.current,
        payload,
      );

      if (imageUrl.trim() && imageUrl.trim() !== nextImageUrl) {
        setHistory((current) => pushUniqueUrl(current, imageUrl.trim()));
      }

      onImageUrlChange(nextImageUrl);
      setIsGenerateModalOpen(false);
      setIsConfirmStage(false);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : t("companyDetails.productImageGenerateError"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const currentAlt =
    productNameUz || productNameRu || t("companyDetails.product");

  return (
    <>
    <Paper
      withBorder
      radius="xl"
      p="lg"
      style={{
        backgroundColor: isDark ? theme.colors.dark[7] : theme.white,
        borderColor: isDark ? theme.colors.dark[4] : theme.colors.gray[3],
      }}
    >
      <Stack gap="md">
        <Box>
          <Text fw={700} size="lg">
            {t("companyDetails.productImagePanelTitle")}
          </Text>
          <Text c="dimmed" size="sm" mt={4}>
            {t("companyDetails.productImagePanelHint")}
          </Text>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileSelect}
        />

        <Group grow align="stretch">
          <Button
            variant="default"
            leftSection={<IconUpload size={16} />}
            onClick={openFilePicker}
            loading={isUploading}
          >
            {t("companyDetails.productImageUploadButton")}
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: "indigo", to: "grape", deg: 45 }}
            leftSection={<IconSparkles size={16} />}
            onClick={openGenerateModal}
            style={{ boxShadow: "0 4px 14px rgba(121, 80, 242, 0.35)" }}
          >
            {t("companyDetails.productImageGenerateButton")}
          </Button>
        </Group>

        {localError ? (
          <Alert color="red" variant="light">
            {localError}
          </Alert>
        ) : null}

        <ImagePreview
          imageUrl={imageUrl}
          alt={currentAlt}
          emptyLabel={t("upload.imageUploadHint", {
            size: formatFileSize(MAX_IMAGE_SIZE_BYTES),
          })}
          height={240}
          maxWidth={640}
        />

        <Box>
          <Group gap={8} mb={6}>
            <IconHistory size={16} color={theme.colors.gray[isDark ? 5 : 6]} />
            <Text fw={600} size="sm">
              {t("companyDetails.productImageHistory")}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mb="sm">
            {t("companyDetails.productImageHistoryHint")}
          </Text>
          {productId && isHistoryLoading ? (
            <Text size="sm" c="dimmed" mb="sm">
              {t("companyDetails.productLoading")}
            </Text>
          ) : null}
          {productId && historyError instanceof Error ? (
            <Alert color="yellow" variant="light" mb="sm">
              {historyError.message}
            </Alert>
          ) : null}
          <Group gap="sm" wrap="wrap">
            {history.length ? (
              history.map((url, index) => (
                <UnstyledButton
                  key={`${url}-${index}`}
                  onClick={() => {
                    onImageUrlChange(url);
                  }}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border:
                      url === imageUrl
                        ? "2px solid var(--mantine-color-blue-6)"
                        : `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                    width: 72,
                    height: 72,
                    backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
                  }}
                >
                  <Box
                    component="img"
                    src={url}
                    alt={`${currentAlt} ${index + 1}`}
                    w="100%"
                    h="100%"
                    style={{ objectFit: "cover" }}
                  />
                </UnstyledButton>
              ))
            ) : (
              <Group gap={8} c="dimmed">
                <IconPhoto size={16} />
                <Text size="sm">
                  {t("companyDetails.productImageHistoryEmpty")}
                </Text>
              </Group>
            )}
          </Group>
        </Box>
      </Stack>
    </Paper>

    <Modal
      opened={isGenerateModalOpen}
      onClose={closeGenerateModal}
      title={t("companyDetails.productImageGenerateModalTitle")}
      centered
      size="lg"
      radius="lg"
      closeOnClickOutside={!isGenerating}
      closeOnEscape={!isGenerating}
      withCloseButton={!isGenerating}
    >
      {isConfirmStage ? (
        <Stack gap="lg" py="xs">
          <Text size="sm" c="dimmed">
            {t("companyDetails.productImageGenerateConfirmMessage")}
          </Text>

          {localError ? (
            <Alert color="red" variant="light">
              {localError}
            </Alert>
          ) : null}

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setIsConfirmStage(false)}
              disabled={isGenerating}
            >
              {t("companyDetails.productImageGenerateCancelButton")}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: "indigo", to: "grape", deg: 45 }}
              leftSection={<IconSparkles size={16} />}
              onClick={() => {
                void handleGenerateImage();
              }}
              loading={isGenerating}
            >
              {t("companyDetails.productImageGenerateConfirmButton")}
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="lg" py="xs">
          <SegmentedControl
            fullWidth
            value={generateMode}
            onChange={(value) =>
              setGenerateMode(value as "product" | "prompt")
            }
            data={[
              {
                label: t("companyDetails.productImageModeProduct"),
                value: "product",
              },
              {
                label: t("companyDetails.productImageModePrompt"),
                value: "prompt",
              },
            ]}
          />

          {generateMode === "prompt" ? (
            <Textarea
              label={t("companyDetails.productImagePromptLabel")}
              placeholder={t("companyDetails.productImagePromptPlaceholder")}
              value={customPrompt}
              onChange={(event) =>
                setCustomPrompt(event.currentTarget.value)
              }
              autosize
              minRows={6}
              maxRows={12}
              size="md"
            />
          ) : (
            <Text size="sm" c="dimmed">
              {t("companyDetails.productImagePanelHint")}
            </Text>
          )}

          {localError ? (
            <Alert color="red" variant="light">
              {localError}
            </Alert>
          ) : null}

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeGenerateModal}>
              {t("companyDetails.productImageGenerateCancelButton")}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: "indigo", to: "grape", deg: 45 }}
              onClick={handleContinueToConfirm}
            >
              {t("companyDetails.productImageContinueButton")}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
    </>
  );
}
