"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import * as d3 from "d3";

export type CompanyHierarchyNode = {
  id?: string;
  name: string;
  level?: string | null;
  country?: string | null;
  city?: string | null;
  foundedYear?: number | null;
  annualRevenue?: number | null;
  employees?: number | null;
  relationshipType?: string | null;
  productName?: string | null;
  relationshipValue?: number | null;
  value?: number;
  children?: CompanyHierarchyNode[];
};

type Props = {
  data: CompanyHierarchyNode;
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  node?: CompanyHierarchyNode;
};

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Render a zoomable packed hierarchy. Leaf radius represents employee count;
 * parent circles are layout containers and must not add a second weight.
 */
export default function CompanyBubbleChart({ data }: Props) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = svgRef.current;

    if (!container || !svgElement) {
      return;
    }

    const drawChart = () => {
      const width = container.clientWidth;

      if (width <= 0) {
        return;
      }

      const height = Math.max(460, Math.min(680, width * 0.72));

      const CHART_PADDING = 24;

      const chartDiameter = Math.max(
        1,

        Math.min(width, height) - CHART_PADDING * 2,
      );

      const svg = d3
        .select<SVGSVGElement, unknown>(svgElement)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("width", "100%")
        .style("height", "auto")
        .style("cursor", "pointer");

      svg.selectAll("*").remove();

      // Only leaf nodes contribute weight; D3 derives parent totals once.
      const hierarchy = d3
        .hierarchy<CompanyHierarchyNode>(data)
        .sum((node) => {
          if (node.children?.length) {
            return 0;
          }

          return Math.max(node.employees ?? node.value ?? 1, 1);
        })
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      const root = d3
        .pack<CompanyHierarchyNode>()
        .size([chartDiameter, chartDiameter])
        .padding(6)(hierarchy);

      const nodes = root.descendants();

      const depthColors = [
        theme.palette.primary.dark,
        theme.palette.primary.main,
        theme.palette.info.main,
        theme.palette.success.main,
        theme.palette.warning.main,
      ];

      let focus = root;
      let view: readonly number[] = [root.x, root.y, root.r * 2];

      const circles = svg
        .append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("fill", (node) => {
          if (node === root) {
            return theme.palette.background.default;
          }

          return depthColors[Math.min(node.depth, depthColors.length - 1)];
        })
        .attr("fill-opacity", (node) => {
          if (node === root) {
            return 0.35;
          }

          return node.children ? 0.26 : 0.78;
        })
        .attr("stroke", (node) => {
          if (node === root) {
            return theme.palette.divider;
          }

          return depthColors[Math.min(node.depth, depthColors.length - 1)];
        })
        .attr("stroke-width", (node) => (node.children ? 2 : 1))
        .style("cursor", (node) => (node === focus ? "default" : "pointer"))
        .on("pointermove", function (event, node) {
          const [x, y] = d3.pointer(event, container);

          d3.select(this)
            .attr("stroke-width", 3)
            .attr("fill-opacity", node.children ? 0.38 : 0.95);

          setTooltip({
            visible: true,
            x,
            y,
            node: node.data,
          });
        })
        .on("pointerleave", function (_event, node) {
          d3.select(this)
            .attr("stroke-width", node.children ? 2 : 1)
            .attr(
              "fill-opacity",
              node === root ? 0.35 : node.children ? 0.26 : 0.78,
            );

          setTooltip((current) => ({
            ...current,
            visible: false,
          }));
        });

      const labels = svg
        .append("g")
        .style("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .style("display", (node) => (node.parent === root ? "inline" : "none"))
        .style("fill", theme.palette.text.primary)
        .style(
          "font-family",
          String(theme.typography.fontFamily ?? "Arial, sans-serif"),
        )
        .style("font-weight", 600)
        .style("paint-order", "stroke")
        .style("stroke", theme.palette.background.paper)
        .style("stroke-width", "3px")
        .style("stroke-linejoin", "round")
        .text((node) => {
          const name = node.data.name;

          return name.length > 18 ? `${name.slice(0, 16)}…` : name;
        });

      // D3 represents a zoom view as [centerX, centerY, diameter].
      const zoomTo = (nextView: readonly number[]) => {
        const [x, y, diameter] = nextView;
        const scale = chartDiameter / diameter;

        view = nextView;

        circles
          .attr(
            "transform",
            (node) =>
              `translate(${(node.x - x) * scale + width / 2},${
                (node.y - y) * scale + height / 2
              })`,
          )
          .attr("r", (node) => node.r * scale);

        labels
          .attr(
            "transform",
            (node) =>
              `translate(${(node.x - x) * scale + width / 2},${
                (node.y - y) * scale + height / 2
              })`,
          )
          .style("font-size", (node) => {
            const radius = node.r * scale;
            return `${Math.max(9, Math.min(14, radius / 3.4))}px`;
          });
      };

      const zoom = (
        event: MouseEvent,
        target: d3.HierarchyCircularNode<CompanyHierarchyNode>,
      ) => {
        focus = target;

        labels.style("display", (node) =>
          node.parent === focus ? "inline" : "none",
        );

        circles.style("cursor", (node) =>
          node === focus ? "default" : "pointer",
        );

        const transition = svg
          .transition()
          .duration(event.altKey ? 2500 : 700)
          .tween("zoom", () => {
            const interpolate = d3.interpolateZoom(
              [view[0], view[1], view[2]],
              [focus.x, focus.y, focus.r * 2],
            );

            return (time: number) => {
              zoomTo(interpolate(time));
            };
          });

        transition.on("end", () => {
          labels.style("display", (node) =>
            node.parent === focus ? "inline" : "none",
          );
        });
      };

      circles.on("click", (event, node) => {
        event.stopPropagation();

        if (focus !== node) {
          zoom(event, node);
        }
      });

      svg.on("click", (event) => {
        if (focus !== root) {
          zoom(event, root);
        }
      });

      zoomTo([root.x, root.y, root.r * 2]);
    };

    drawChart();

    // Repack from the source hierarchy when the responsive container changes.
    const resizeObserver = new ResizeObserver(() => {
      drawChart();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      d3.select(svgElement).interrupt();
      d3.select(svgElement).selectAll("*").remove();
    };
  }, [
    data,
    theme.palette.background.default,
    theme.palette.background.paper,
    theme.palette.divider,
    theme.palette.info.main,
    theme.palette.primary.dark,
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.text.primary,
    theme.palette.warning.main,
    theme.typography.fontFamily,
  ]);

  const hasData = Boolean(data.children?.length);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        minHeight: 460,
        overflow: "hidden",
        borderRadius: 2,
        bgcolor: "background.default",
      }}
    >
      {!hasData ? (
        <Box
          sx={{
            minHeight: 460,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">
            No hierarchy data matches the selected filters
          </Typography>
        </Box>
      ) : (
        <svg
          ref={svgRef}
          role="img"
          aria-label="Zoomable company hierarchy bubble chart"
        />
      )}

      {tooltip.visible && tooltip.node && (
        <Box
          sx={{
            position: "absolute",
            left: tooltip.x + 14,
            top: tooltip.y + 14,
            zIndex: 10,
            width: 220,
            p: 1.5,
            pointerEvents: "none",
            borderRadius: 1.5,
            bgcolor: "background.paper",
            color: "text.primary",
            boxShadow: 6,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {tooltip.node.name}
          </Typography>

          <Typography variant="caption" component="div">
            Level: {tooltip.node.level || "N/A"}
          </Typography>

          <Typography variant="caption" component="div">
            Location:{" "}
            {[tooltip.node.city, tooltip.node.country]
              .filter(Boolean)
              .join(", ") || "N/A"}
          </Typography>

          <Typography variant="caption" component="div">
            Founded: {tooltip.node.foundedYear ?? "N/A"}
          </Typography>

          <Typography variant="caption" component="div">
            Revenue: {formatMoney(tooltip.node.annualRevenue)}
          </Typography>

          <Typography variant="caption" component="div">
            Employees: {formatNumber(tooltip.node.employees)}
          </Typography>

          {tooltip.node.relationshipType && (
            <Typography variant="caption" component="div">
              Relationship: {tooltip.node.relationshipType}
            </Typography>
          )}

          {tooltip.node.productName && (
            <Typography variant="caption" component="div">
              Product: {tooltip.node.productName}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

