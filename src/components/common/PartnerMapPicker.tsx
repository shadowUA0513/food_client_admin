import { Box, Paper, Stack, Text } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Partner } from "../../types/partners";

type PartnerMapPickerProps = {
  partners: Partner[];
  selectedPartnerId: string;
  onSelectPartner: (partnerId: string) => void;
};

const YANDEX_MAPS_SCRIPT_ID = "yandex-maps-api-script";
const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

function getPartnerLabel(partner: Partner, language: string) {
  return language === "uz" ? partner.name_uz || partner.name_ru : partner.name_ru || partner.name_uz;
}

function getBounds(points: [number, number][]) {
  const latitudes = points.map(([latitude]) => latitude);
  const longitudes = points.map(([, longitude]) => longitude);

  return [
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)],
  ];
}

function loadYandexMapsScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.ymaps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      YANDEX_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load map.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    const query = YANDEX_MAPS_API_KEY ? `&apikey=${YANDEX_MAPS_API_KEY}` : "";
    script.id = YANDEX_MAPS_SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${query}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load map."));
    document.head.appendChild(script);
  });
}

export function PartnerMapPicker({
  partners,
  selectedPartnerId,
  onSelectPartner,
}: PartnerMapPickerProps) {
  const { t, i18n } = useTranslation();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YandexMapInstance | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const language = i18n.resolvedLanguage ?? "ru";

  const partnersWithCoordinates = useMemo(
    () =>
      partners
        .filter(
          (partner) =>
            Number.isFinite(partner.latitude) && Number.isFinite(partner.longitude),
        )
        .map((partner) => ({
          partner,
          coordinates: [partner.latitude, partner.longitude] as [number, number],
        })),
    [partners],
  );

  useEffect(() => {
    if (!mapRef.current || !partnersWithCoordinates.length) {
      return;
    }

    let cancelled = false;

    void loadYandexMapsScript()
      .then(() => {
        if (cancelled || !mapRef.current || !window.ymaps) {
          return;
        }

        window.ymaps.ready(() => {
          if (cancelled || !mapRef.current || !window.ymaps) {
            return;
          }

          mapInstanceRef.current?.destroy();

          const initialCenter = partnersWithCoordinates[0]?.coordinates ?? [41.3111, 69.2797];
          const map = new window.ymaps.Map(
            mapRef.current,
            {
              center: initialCenter,
              zoom: 12,
              controls: ["zoomControl", "geolocationControl"],
            },
            {
              suppressMapOpenBlock: true,
            },
          );
          const mapWithBounds = map as YandexMapInstance & {
            setBounds?: (
              bounds: number[][],
              options?: Record<string, unknown>,
            ) => void;
          };

          partnersWithCoordinates.forEach(({ partner, coordinates }) => {
            const isActive = partner.id === selectedPartnerId;
            const placemark = new window.ymaps!.Placemark(
              coordinates,
              {
                hintContent: getPartnerLabel(partner, language),
                balloonContentHeader: getPartnerLabel(partner, language),
                balloonContentBody: partner.address_description,
              },
              {
                preset: isActive ? "islands#orangeDotIcon" : "islands#blueDotIcon",
              },
            );

            placemark.events.add("click", () => {
              onSelectPartner(partner.id);
            });

            map.geoObjects.add(placemark);
          });

          const points = partnersWithCoordinates.map(({ coordinates }) => coordinates);
          if (points.length > 1) {
            mapWithBounds.setBounds?.(getBounds(points), {
              checkZoomRange: true,
              zoomMargin: 32,
            });
          }

          mapInstanceRef.current = map;
          setMapError(null);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setMapError(t("createOrderPage.partnerMapUnavailable"));
        }
      });

    return () => {
      cancelled = true;
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
    };
  }, [language, onSelectPartner, partnersWithCoordinates, selectedPartnerId, t]);

  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="md">
        <Stack gap={4}>
          <Text fw={700}>{t("createOrderPage.partnerMapTitle")}</Text>
          <Text size="sm" c="dimmed">
            {t("createOrderPage.partnerMapDescription")}
          </Text>
        </Stack>
      </Paper>

      {partnersWithCoordinates.length ? (
        <Box
          ref={mapRef}
          style={{
            minHeight: 320,
            width: "100%",
            overflow: "hidden",
            borderRadius: 16,
            border: "1px solid var(--mantine-color-gray-3)",
          }}
        />
      ) : (
        <Paper withBorder radius="md" p="md">
          <Text size="sm" c="dimmed">
            {t("createOrderPage.partnerNoCoordinates")}
          </Text>
        </Paper>
      )}

      {mapError ? (
        <Paper withBorder radius="md" p="md">
          <Text size="sm" c="red">
            {mapError}
          </Text>
        </Paper>
      ) : null}
    </Stack>
  );
}
