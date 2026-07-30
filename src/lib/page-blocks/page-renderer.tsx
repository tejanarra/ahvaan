import type { BlockInstance, ContainerLayoutMode, PageSchema } from "./types";
import type { PageRenderContext } from "./context";
import { BLOCK_REGISTRY } from "./registry";
import { layoutWrapperStyle, parseInlineStyle } from "./layout-controls";

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
    <div style={layoutWrapperStyle(block.layout, parentLayoutMode)}>
      <Render config={block.config} ctx={ctx} renderedChildren={renderedChildren} />
    </div>
  );
}

export function PageRenderer({ schema, ctx }: { schema: PageSchema; ctx: PageRenderContext }) {
  return (
    <div
      className="flex min-h-dvh flex-col gap-10 px-4 py-12 sm:py-16"
      style={{ fontFamily: schema.fontFamily || undefined, ...parseInlineStyle(schema.pageStyle) }}
    >
      {schema.blocks.map((block) => (
        <RenderBlock key={block.id} block={block} ctx={ctx} />
      ))}
    </div>
  );
}
