import type { Metadata } from "next";
import { DocsArticle, Callout, CodeBlock, FileRef, DocsPrevNext } from "@/components/docs/docs-ui";

export const metadata: Metadata = {
  title: "Adding a block type",
  description: "The exact steps to add a new page-builder block, and the parallel pattern for form field kinds.",
  openGraph: { images: [`/docs/og?title=${encodeURIComponent("Adding a block type")}&section=Reference`] },
  twitter: { card: "summary_large_image", images: [`/docs/og?title=${encodeURIComponent("Adding a block type")}&section=Reference`] },
};

export default function AddingABlockReferencePage() {
  return (
    <DocsArticle
      title="Adding a block type"
      description="The exact steps to add a new page-builder block, and the parallel pattern for form field kinds."
      current="/docs/reference/adding-a-block"
    >
      <p>
        Every block type is looked up by a single <FileRef>type</FileRef> string, both by the
        public page renderer and the dashboard builder canvas — adding a new one never requires
        either of those to change. The steps below are numbered in the order you&rsquo;d actually
        do them.
      </p>

      <h2>Steps</h2>
      <ol>
        <li>
          Add the config type and a union member in <FileRef>src/lib/blocks/types.ts</FileRef>.
          Every other block config is defined the same way — see <FileRef>CustomHtmlConfig</FileRef>{" "}
          at <FileRef>src/lib/blocks/types.ts:242</FileRef> — and the <FileRef>BlockInstance</FileRef>{" "}
          discriminated union that every block adds one arm to starts at{" "}
          <FileRef>src/lib/blocks/types.ts:292</FileRef>.
        </li>
        <li>
          Create <FileRef>src/lib/blocks/blocks/&lt;name&gt;.tsx</FileRef> exporting a default
          config, an <FileRef>Edit</FileRef> component, and a <FileRef>Render</FileRef> component.
          Use an existing block as the template — <FileRef>src/lib/blocks/blocks/custom-html.tsx</FileRef>{" "}
          exports <FileRef>customHtmlDefaultConfig</FileRef> at{" "}
          <FileRef>src/lib/blocks/blocks/custom-html.tsx:9</FileRef>, <FileRef>CustomHtmlEdit</FileRef>{" "}
          at <FileRef>src/lib/blocks/blocks/custom-html.tsx:16</FileRef>, and{" "}
          <FileRef>CustomHtmlRender</FileRef> at{" "}
          <FileRef>src/lib/blocks/blocks/custom-html.tsx:91</FileRef>.
        </li>
        <li>
          Add one entry to <FileRef>BLOCK_REGISTRY</FileRef> in{" "}
          <FileRef>src/lib/blocks/registry.tsx</FileRef> (the object starts at{" "}
          <FileRef>src/lib/blocks/registry.tsx:78</FileRef>; the <FileRef>custom-html</FileRef> entry
          at <FileRef>src/lib/blocks/registry.tsx:150</FileRef> is the shape to copy: type label,
          default config, Edit, Render).
        </li>
        <li>
          Add the type string to <FileRef>BLOCK_TYPES</FileRef> in{" "}
          <FileRef>src/lib/schemas/page-schema.ts:12</FileRef> — this is the Zod enum that
          validates every stored block&rsquo;s <FileRef>type</FileRef> field; a block type missing
          here gets silently dropped by <FileRef>parsePageSchema</FileRef> the moment a page with
          it is loaded.
        </li>
      </ol>

      <p>That&rsquo;s the whole extension point. Import it and register it once each:</p>

      <CodeBlock>{`export type BlockDefinition<C> = {
  type: BlockType;
  label: string;
  defaultConfig: C;
  Edit: ComponentType<{
    config: C;
    onChange: (next: C) => void;
    childBlocks?: BlockInstance[];
    renderChildList?: () => ReactNode;
    event?: EventRecord;
    onEventFieldsChange?: (patch: Partial<EventRecord>) => void;
    availableForms?: FormRecord[];
  }>;
  Render: ComponentType<{
    config: C;
    ctx: PageRenderContext;
    renderedChildren?: ReactNode[];
  }>;
};`}</CodeBlock>

      <p>
        <FileRef>childBlocks</FileRef>/<FileRef>renderChildList</FileRef> are only read by the
        container block&rsquo;s <FileRef>Edit</FileRef>; <FileRef>event</FileRef>/
        <FileRef>onEventFieldsChange</FileRef> only by blocks (like hero) that edit the
        event&rsquo;s own fields directly; <FileRef>availableForms</FileRef> only by the form
        block&rsquo;s &ldquo;which form?&rdquo; dropdown. A new block&rsquo;s <FileRef>Edit</FileRef>{" "}
        simply ignores whichever of these it doesn&rsquo;t need.
      </p>

      <h2>The parallel pattern for form fields</h2>
      <p>
        The generic Forms system (<FileRef>src/lib/forms/</FileRef>) is explicitly modeled on the
        same shape, applied to form field kinds instead of page blocks: a{" "}
        <FileRef>FieldTypeDefinition</FileRef> type (
        <FileRef>src/lib/forms/registry.tsx:45</FileRef>) pairs a config type with an{" "}
        <FileRef>Edit</FileRef>/<FileRef>Input</FileRef> component pair and one{" "}
        <FileRef>FieldValidator</FileRef> subclass, all looked up from a single{" "}
        <FileRef>FIELD_TYPE_REGISTRY</FileRef> table (
        <FileRef>src/lib/forms/registry.tsx:68</FileRef>). Adding a new field kind means: a config
        type in <FileRef>src/lib/forms/types.ts</FileRef>, a validator extending{" "}
        <FileRef>FieldValidator</FileRef> (the abstract base at{" "}
        <FileRef>src/lib/forms/validators/base.ts:10</FileRef> implements the shared
        required/empty short-circuit once — a subclass only implements its own{" "}
        <FileRef>isEmpty</FileRef> and <FileRef>validateValue</FileRef>), an Edit+Input pair under{" "}
        <FileRef>src/lib/forms/fields/*.tsx</FileRef>, and one entry in{" "}
        <FileRef>FIELD_TYPE_REGISTRY</FileRef> plus the kind string in{" "}
        <FileRef>FIELD_KINDS</FileRef> (<FileRef>src/lib/forms/registry.tsx:173</FileRef>).
      </p>

      <Callout>
        Both registries exist so their respective renderer/editor never needs a type-specific
        branch anywhere else in the codebase — every consumer just looks the type up by key.
      </Callout>

      <DocsPrevNext current="/docs/reference/adding-a-block" />
    </DocsArticle>
  );
}
