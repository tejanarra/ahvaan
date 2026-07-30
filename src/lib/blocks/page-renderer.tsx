import type { BlockInstance, ContainerLayoutMode, PageSchema } from "./types";
import type { PageRenderContext } from "./context";
import { BLOCK_REGISTRY } from "./registry";
import { blockResponsiveCss, layoutWrapperStyle, parseInlineStyle } from "./layout-controls";

// Every block's own per-device `@media` rules (see blockResponsiveCss),
// walked recursively into container children — collected once and emitted
// as a single <style> tag rather than one per block, so a deeply nested
// page doesn't end up with dozens of near-empty style elements.
function collectResponsiveCss(blocks: BlockInstance[]): string {
  return blocks
    .flatMap((block) => {
      const own = blockResponsiveCss(block.id, block.layout);
      const nested = "children" in block ? collectResponsiveCss(block.children) : "";
      return [own, nested].filter(Boolean);
    })
    .join("\n");
}

function RenderBlock({
  block,
  ctx,
  parentLayoutMode,
}: {
  block: BlockInstance;
  ctx: PageRenderContext;
  parentLayoutMode?: ContainerLayoutMode;
}) {
  const def = BLOCK_REGISTRY[block.type];
  if (!def) return null;
  const Render = def.Render;
  const childBlocks = "children" in block ? block.children : undefined;
  // Passed to each child so it knows whether its own wrapper needs to be
  // 100%-wide (normal page flow / "column"/"grid" containers) or size to its
  // own content instead (a "row" container's children — see layoutWrapperStyle).
  const childLayoutMode = "children" in block ? (block.config.layoutMode ?? "column") : undefined;

  const renderedChildren = childBlocks?.map((child) => (
    <RenderBlock key={child.id} block={child} ctx={ctx} parentLayoutMode={childLayoutMode} />
  ));

  return (
    <div data-block-id={block.id} style={layoutWrapperStyle(block.layout, parentLayoutMode)}>
      <Render config={block.config} ctx={ctx} renderedChildren={renderedChildren} />
    </div>
  );
}

export function PageRenderer({ schema, ctx }: { schema: PageSchema; ctx: PageRenderContext }) {
  const responsiveCss = collectResponsiveCss(schema.blocks);

  return (
    <div
      className="flex min-h-dvh flex-col gap-10 px-4 py-12 sm:py-16"
      style={{ fontFamily: schema.fontFamily || undefined, ...parseInlineStyle(schema.pageStyle) }}
    >
      {/* Values are validated enums / generated block ids only — never
          host-authored text — see blockResponsiveCss for the trust
          argument that makes this safe unlike a host-controlled string. */}
      {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
      {schema.blocks.map((block) => (
        <RenderBlock key={block.id} block={block} ctx={ctx} />
      ))}
    </div>
  );
}
